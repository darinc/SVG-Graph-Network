/**
 * RenderingCoordinator - Integration layer for rendering coordination
 *
 * Extracted from GraphNetwork to reduce God Object anti-pattern.
 * Provides clean abstraction over SVGRenderer with graph-specific rendering logic.
 */

import { SVGRenderer, RenderLink } from './SVGRenderer';
import { Node } from '../Node';
import { ThemeManager, VisualState } from '../theming/ThemeManager';
import { NodeData, RendererConfig } from '../types/index';

/**
 * Rendering state for tracking what needs to be rendered
 */
export interface RenderingState {
    needsElementCreation: boolean;
    needsRender: boolean;
    needsThemeUpdate: boolean;
    lastRenderTime: number;
}

/**
 * Rendering metrics for performance tracking
 */
export interface RenderingMetrics {
    frameRate: number;
    lastFrameTime: number;
    renderCallCount: number;
    skipFrameCount: number;
    averageRenderTime: number;
}

/**
 * RenderingCoordinator handles all rendering coordination for graph networks
 *
 * Responsibilities:
 * - Manages SVGRenderer lifecycle
 * - Coordinates element creation and rendering
 * - Handles transform operations
 * - Tracks rendering state and metrics
 * - Manages theme integration with rendering
 */
export class RenderingCoordinator<T extends NodeData = NodeData> {
    private renderer: SVGRenderer;
    private themeManager: ThemeManager;
    private state: RenderingState;
    private metrics: RenderingMetrics;

    // Performance tracking
    private renderTimes: number[] = [];
    private maxRenderTimeHistory = 100;

    constructor(
        container: HTMLElement,
        containerId: string,
        themeManager: ThemeManager,
        config: Partial<RendererConfig> = {}
    ) {
        this.renderer = new SVGRenderer(container, containerId, themeManager, config);
        this.themeManager = themeManager;

        this.state = {
            needsElementCreation: true,
            needsRender: true,
            needsThemeUpdate: true,
            lastRenderTime: 0
        };

        this.metrics = {
            frameRate: 0,
            lastFrameTime: 0,
            renderCallCount: 0,
            skipFrameCount: 0,
            averageRenderTime: 0
        };
    }

    /**
     * Initialize the rendering system
     */
    initialize(): void {
        this.renderer.initialize();
        this.state.needsElementCreation = true;
        this.state.needsRender = true;
    }

    /**
     * Render the current graph state
     *
     * @param nodes - Map of all nodes in the graph
     * @param links - Array of graph links
     * @param filteredNodes - Set of visible node IDs
     * @param forceRender - Force rendering even if no changes detected
     * @returns true if render was executed, false if skipped
     */
    render(
        nodes: Map<string, Node<T>>,
        links: RenderLink<T>[],
        filteredNodes: Set<string>,
        forceRender = false
    ): boolean {
        const currentTime = performance.now();
        const renderStartTime = currentTime;

        // Skip rendering if not needed and not forced
        if (!this.shouldRender(currentTime) && !forceRender) {
            this.metrics.skipFrameCount++;
            return false;
        }

        // Create elements if needed
        if (this.state.needsElementCreation) {
            this.renderer.createElements(nodes, links);
            this.state.needsElementCreation = false;
        }

        // Apply theme updates if needed
        if (this.state.needsThemeUpdate) {
            this.renderer.applyCanvasTheming();
            this.state.needsThemeUpdate = false;
        }

        // Perform the render
        this.renderer.render(nodes, links, filteredNodes);

        // Update state and metrics
        this.state.needsRender = false;
        this.state.lastRenderTime = currentTime;
        this.metrics.renderCallCount++;
        this.metrics.lastFrameTime = currentTime;

        // Track render performance
        const renderTime = performance.now() - renderStartTime;
        this.trackRenderTime(renderTime);

        return true;
    }

    /**
     * Request element recreation on next render
     */
    requestElementCreation(): void {
        this.state.needsElementCreation = true;
        this.state.needsRender = true;
    }

    /**
     * Request render on next frame
     */
    requestRender(): void {
        this.state.needsRender = true;
    }

    /**
     * Request theme update on next render
     */
    requestThemeUpdate(): void {
        this.state.needsThemeUpdate = true;
        this.state.needsRender = true;
    }

    /**
     * Set viewport transform
     */
    setTransform(x: number, y: number, scale: number): void {
        this.renderer.setTransform(x, y, scale);
    }

    /**
     * Get current transform state
     */
    getTransform() {
        return this.renderer.getTransform();
    }

    /**
     * Get rendering bounds
     */
    getBounds(nodes: Map<string, Node<T>>, filteredNodes: Set<string>) {
        return this.renderer.getBounds(nodes, filteredNodes);
    }

    /**
     * Get SVG element for external access
     */
    getSVGElement(): SVGSVGElement | null {
        return this.renderer.getSVGElement();
    }

    /**
     * Get node elements map for event handling
     */
    getNodeElements(): ReadonlyMap<Node<T>, unknown> {
        return this.renderer.getNodeElements() as ReadonlyMap<Node<T>, unknown>;
    }

    /**
     * Update specific element state
     */
    updateElementState(elementId: string, state: VisualState, enabled: boolean): void {
        this.renderer.updateElementState(elementId, state, enabled);
    }

    /**
     * Resize the rendering area
     */
    resize(width: number, height: number): void {
        this.renderer.resize(width, height);
        this.requestRender();
    }

    /**
     * Get current rendering state
     */
    getRenderingState(): RenderingState {
        return { ...this.state };
    }

    /**
     * Get rendering metrics
     */
    getRenderingMetrics(): RenderingMetrics {
        return { ...this.metrics };
    }

    /**
     * Reset rendering metrics
     */
    resetMetrics(): void {
        this.metrics = {
            frameRate: 0,
            lastFrameTime: performance.now(),
            renderCallCount: 0,
            skipFrameCount: 0,
            averageRenderTime: 0
        };
        this.renderTimes = [];
    }

    /**
     * Export current rendering as image
     */
    async exportAsImage(format: 'png' | 'svg' = 'png'): Promise<string> {
        const svg = this.getSVGElement();
        if (!svg) {
            throw new Error('No SVG element available for export');
        }

        if (format === 'svg') {
            return new XMLSerializer().serializeToString(svg);
        }

        // For PNG, we need to create a canvas
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            const svgData = new XMLSerializer().serializeToString(svg);
            const img = new window.Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };

            img.onerror = reject;
            img.src = 'data:image/svg+xml;base64,' + window.btoa(svgData);
        });
    }

    /**
     * Clean up rendering coordinator resources
     */
    destroy(): void {
        this.renderer.destroy();
        this.renderTimes = [];
    }

    /**
     * Determine if rendering should occur based on state and timing
     * @private
     */
    private shouldRender(currentTime: number): boolean {
        // Always render if explicitly requested
        if (
            this.state.needsRender ||
            this.state.needsElementCreation ||
            this.state.needsThemeUpdate
        ) {
            return true;
        }

        // Skip if rendered too recently (throttle at 60fps)
        const timeSinceLastRender = currentTime - this.state.lastRenderTime;
        if (timeSinceLastRender < 16.67) {
            // ~60fps
            return false;
        }

        return false;
    }

    /**
     * Track render time for performance metrics
     * @private
     */
    private trackRenderTime(renderTime: number): void {
        this.renderTimes.push(renderTime);

        // Keep only recent render times
        if (this.renderTimes.length > this.maxRenderTimeHistory) {
            this.renderTimes.shift();
        }

        // Calculate average render time
        const sum = this.renderTimes.reduce((a, b) => a + b, 0);
        this.metrics.averageRenderTime = sum / this.renderTimes.length;

        // Calculate frame rate
        const now = performance.now();
        const timeDelta = now - this.metrics.lastFrameTime;
        if (timeDelta > 0) {
            this.metrics.frameRate = 1000 / timeDelta;
        }
    }

    /**
     * Factory method to create RenderingCoordinator
     */
    static create<T extends NodeData = NodeData>(
        container: HTMLElement,
        containerId: string,
        themeManager: ThemeManager,
        config: Partial<RendererConfig> = {}
    ): RenderingCoordinator<T> {
        return new RenderingCoordinator<T>(container, containerId, themeManager, config);
    }
}
