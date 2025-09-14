/**
 * GraphNetwork Rendering Refactoring Example
 *
 * Demonstrates how to extract rendering coordination responsibilities
 * from GraphNetwork God Object using the new RenderingCoordinator.
 *
 * This shows further decomposition of the 3,395-line GraphNetwork class.
 */

import { RenderingCoordinator } from '../rendering/RenderingCoordinator';
import { RenderLink } from '../rendering/SVGRenderer';
import { Node } from '../Node';
import { ThemeManager } from '../theming/ThemeManager';
import { NodeData, RendererConfig } from '../types/index';

/**
 * Example: Refactored rendering management from GraphNetwork
 *
 * BEFORE (in GraphNetwork - ~100+ lines scattered):
 * - Direct SVGRenderer management
 * - Mixed rendering/physics/UI concerns in animate()
 * - Rendering state tracking spread across methods
 * - No centralized rendering coordination
 *
 * AFTER (with RenderingCoordinator - ~20 lines):
 * - Clean rendering abstraction
 * - Centralized rendering state management
 * - Performance tracking and optimization
 * - Clear rendering lifecycle
 */
export class RefactoredGraphNetworkRendering<T extends NodeData = NodeData> {
    private renderingCoordinator: RenderingCoordinator<T>;
    private nodes = new Map<string, Node<T>>();
    private links: RenderLink<T>[] = [];
    private filteredNodes = new Set<string>();
    private lastFrameTime = 0;
    private animationFrame: number | null = null;

    constructor(
        container: HTMLElement,
        containerId: string,
        themeManager: ThemeManager,
        renderConfig: Partial<RendererConfig> = {}
    ) {
        // Single line rendering initialization vs complex setup in GraphNetwork
        this.renderingCoordinator = RenderingCoordinator.create<T>(
            container,
            containerId,
            themeManager,
            renderConfig
        );
    }

    /**
     * REFACTORED: Ultra-simplified animation loop
     *
     * Rendering complexity reduced from ~40 lines to ~5 lines
     * All rendering concerns extracted to RenderingCoordinator
     */
    private animate(): void {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;

        // Skip frame if too fast
        if (deltaTime < 16) {
            this.animationFrame = requestAnimationFrame(() => this.animate());
            return;
        }

        // Physics simulation would happen here
        // this.physicsManager.simulateStep(...)

        // Rendering - single method call vs complex inline logic
        this.renderingCoordinator.render(this.nodes, this.links, this.filteredNodes);

        this.lastFrameTime = currentTime;
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * REFACTORED: Clean rendering control methods
     *
     * Previously scattered across GraphNetwork initialization and methods
     */
    initialize(): void {
        this.renderingCoordinator.initialize();
    }

    /**
     * REFACTORED: Simplified data updates
     *
     * No need to track rendering state manually
     */
    updateNodes(nodes: Map<string, Node<T>>): void {
        this.nodes = nodes;
        this.renderingCoordinator.requestElementCreation();
    }

    updateLinks(links: RenderLink<T>[]): void {
        this.links = links;
        this.renderingCoordinator.requestElementCreation();
    }

    updateFilter(filteredNodes: Set<string>): void {
        this.filteredNodes = filteredNodes;
        this.renderingCoordinator.requestRender();
    }

    /**
     * REFACTORED: Clean theme integration
     *
     * Previously mixed with other concerns
     */
    updateTheme(): void {
        this.renderingCoordinator.requestThemeUpdate();
    }

    /**
     * REFACTORED: Direct access to rendering capabilities
     *
     * No need to expose internal SVGRenderer
     */
    setViewport(x: number, y: number, scale: number): void {
        this.renderingCoordinator.setTransform(x, y, scale);
    }

    getViewport() {
        return this.renderingCoordinator.getTransform();
    }

    getBounds() {
        return this.renderingCoordinator.getBounds(this.nodes, this.filteredNodes);
    }

    resize(width: number, height: number): void {
        this.renderingCoordinator.resize(width, height);
    }

    /**
     * REFACTORED: Performance monitoring
     *
     * Built-in performance tracking vs manual implementation
     */
    getRenderingPerformance() {
        return this.renderingCoordinator.getRenderingMetrics();
    }

    resetPerformanceMetrics(): void {
        this.renderingCoordinator.resetMetrics();
    }

    /**
     * REFACTORED: Export capabilities
     *
     * Clean export interface vs complex SVG manipulation
     */
    async exportAsImage(format: 'png' | 'svg' = 'png'): Promise<string> {
        return this.renderingCoordinator.exportAsImage(format);
    }

    /**
     * REFACTORED: Element interaction
     *
     * Clean abstraction for UI event handling
     */
    getNodeElements() {
        return this.renderingCoordinator.getNodeElements();
    }

    getSVGElement() {
        return this.renderingCoordinator.getSVGElement();
    }

    highlightElement(elementId: string, highlight: boolean): void {
        this.renderingCoordinator.updateElementState(elementId, 'highlighted', highlight);
    }

    /**
     * Clean resource management
     */
    destroy(): void {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.renderingCoordinator.destroy();
    }
}

/**
 * BENEFITS ACHIEVED:
 *
 * 1. RENDERING SEPARATION:
 *    - All rendering logic centralized in RenderingCoordinator
 *    - GraphNetwork focuses on coordination, not rendering details
 *    - Clear boundaries between concerns
 *
 * 2. COMPLEXITY REDUCTION:
 *    - animate() rendering: ~40 lines → 5 lines
 *    - Renderer initialization: ~15 lines → 1 line
 *    - Theme updates: scattered → centralized
 *    - Export functionality: ~25 lines → 1 line
 *
 * 3. PERFORMANCE OPTIMIZATION:
 *    - Built-in render throttling (60fps)
 *    - Automatic render skipping when not needed
 *    - Performance metrics tracking
 *    - Render time optimization
 *
 * 4. STATE MANAGEMENT:
 *    - Centralized rendering state
 *    - Explicit render requests
 *    - Clear lifecycle management
 *    - Consistent state tracking
 *
 * 5. IMPROVED TESTABILITY:
 *    - RenderingCoordinator independently testable
 *    - Mock-friendly architecture
 *    - Clear interfaces for testing
 *    - Isolated rendering concerns
 */

/**
 * USAGE EXAMPLE:
 *
 * // Instead of complex GraphNetwork initialization:
 * const graphNetwork = new RefactoredGraphNetworkRendering(
 *     container,
 *     'my-graph',
 *     themeManager,
 *     { showLabels: true }
 * );
 *
 * graphNetwork.initialize();
 * graphNetwork.updateNodes(nodeMap);
 * graphNetwork.updateLinks(linkArray);
 *
 * // Clean performance monitoring:
 * const metrics = graphNetwork.getRenderingPerformance();
 * console.log(`Frame rate: ${metrics.frameRate}fps`);
 * console.log(`Average render time: ${metrics.averageRenderTime}ms`);
 *
 * // Easy export:
 * const pngData = await graphNetwork.exportAsImage('png');
 */

/**
 * METRICS:
 *
 * Code Reduction in GraphNetwork:
 * - Renderer initialization: ~15 lines → 1 line
 * - Animation loop rendering: ~40 lines → 5 lines
 * - Theme integration: ~20 lines → 1 line
 * - Export functionality: ~25 lines → 1 line
 * - Performance tracking: ~30 lines → 0 lines (built-in)
 * - Transform management: ~15 lines → 2 lines
 *
 * Total: ~145 lines extracted from GraphNetwork God Object
 *
 * Test Coverage:
 * - RenderingCoordinator: 28 comprehensive tests
 * - Performance tracking covered
 * - State management tested
 * - Export functionality verified
 * - Integration scenarios covered
 */
