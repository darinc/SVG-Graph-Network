/**
 * CameraController - Handles view focus and smooth camera transitions
 *
 * Provides advanced camera control with support for:
 * - Smooth focus animations to specific nodes or groups
 * - Fit-to-view operations with padding
 * - Configurable easing functions and transitions
 * - View bounds calculation and management
 * - Animation state tracking and cancellation
 */

import {
    ICameraController,
    FocusOptions,
    ViewBounds,
    AnimationState,
    EasingFunction,
    FocusEvent
} from '../types/styling';
import { TransformState } from '../types/index';

/**
 * Focus change callback type
 */
export type FocusChangeCallback = (event: FocusEvent) => void;

/**
 * Node position data for calculations
 */
interface NodePosition {
    id: string;
    x: number;
    y: number;
    size?: number;
}

/**
 * Easing function implementations
 */
const EASING_FUNCTIONS = {
    linear: (t: number) => t,
    ease: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    'ease-in': (t: number) => t * t,
    'ease-out': (t: number) => t * (2 - t),
    'ease-in-out': (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    'cubic-bezier': (t: number) => t * t * (3 - 2 * t) // Custom cubic-bezier approximation
};

/**
 * CameraController handles all view focus and animation operations
 */
export class CameraController implements ICameraController {
    private currentTransform: TransformState = { x: 0, y: 0, scale: 1 };
    private animationState: AnimationState | null = null;
    private readonly onFocusChange?: FocusChangeCallback;
    private nodePositions = new Map<string, NodePosition>();
    private viewportSize = { width: 800, height: 600 };
    private svgElement?: SVGSVGElement;
    private transformGroup?: SVGGElement;

    /**
     * Create a new CameraController
     * @param onFocusChange - Callback for focus changes
     */
    constructor(onFocusChange?: FocusChangeCallback) {
        this.onFocusChange = onFocusChange;
    }

    /**
     * Initialize with SVG elements
     */
    initialize(svgElement: SVGSVGElement, transformGroup: SVGGElement): void {
        this.svgElement = svgElement;
        this.transformGroup = transformGroup;
        this.updateViewportSize();
    }

    /**
     * Focus on a single node with smooth animation
     */
    async focusOnNode(nodeId: string, options: FocusOptions = {}): Promise<void> {
        const nodePosition = this.nodePositions.get(nodeId);
        if (!nodePosition) {
            throw new Error(`Node '${nodeId}' not found`);
        }

        return this.focusOnNodes([nodeId], options);
    }

    /**
     * Focus on multiple nodes by fitting them in view
     */
    async focusOnNodes(nodeIds: string[], options: FocusOptions = {}): Promise<void> {
        if (nodeIds.length === 0) {
            throw new Error('No nodes provided for focus');
        }

        const positions = nodeIds
            .map(id => this.nodePositions.get(id))
            .filter(Boolean) as NodePosition[];
        if (positions.length === 0) {
            throw new Error('None of the provided nodes were found');
        }

        const bounds = this.calculateBounds(positions);
        const targetTransform = this.calculateTargetTransform(bounds, options);

        await this.animateToTransform(targetTransform, options);
        this.emitFocusChange(nodeIds, targetTransform, options);
    }

    /**
     * Fit entire graph to view with padding
     */
    async fitToView(padding: number = 50): Promise<void> {
        if (this.nodePositions.size === 0) {
            return;
        }

        const allPositions = Array.from(this.nodePositions.values());
        const bounds = this.calculateBounds(allPositions);
        const targetTransform = this.calculateTargetTransform(bounds, { padding, animated: true });

        await this.animateToTransform(targetTransform, { padding, animated: true });
    }

    /**
     * Center the view on the graph center
     */
    async centerView(): Promise<void> {
        if (this.nodePositions.size === 0) {
            return;
        }

        const allPositions = Array.from(this.nodePositions.values());
        const bounds = this.calculateBounds(allPositions);

        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;

        const targetTransform: TransformState = {
            x: this.viewportSize.width / 2 - centerX * this.currentTransform.scale,
            y: this.viewportSize.height / 2 - centerY * this.currentTransform.scale,
            scale: this.currentTransform.scale
        };

        await this.animateToTransform(targetTransform, { animated: true });
    }

    /**
     * Get current view bounds in graph coordinates
     */
    getViewBounds(): ViewBounds {
        const scale = this.currentTransform.scale;
        const viewLeft = -this.currentTransform.x / scale;
        const viewTop = -this.currentTransform.y / scale;
        const viewWidth = this.viewportSize.width / scale;
        const viewHeight = this.viewportSize.height / scale;

        return {
            minX: viewLeft,
            maxX: viewLeft + viewWidth,
            minY: viewTop,
            maxY: viewTop + viewHeight,
            width: viewWidth,
            height: viewHeight,
            center: {
                x: viewLeft + viewWidth / 2,
                y: viewTop + viewHeight / 2
            }
        };
    }

    /**
     * Check if animation is currently running
     */
    isAnimating(): boolean {
        return this.animationState?.active || false;
    }

    /**
     * Stop current animation
     */
    stopAnimation(): void {
        if (this.animationState?.active) {
            this.animationState.active = false;
            if (this.animationState.onComplete) {
                this.animationState.onComplete();
            }
        }
    }

    /**
     * Set transform directly with optional animation
     */
    async setTransform(
        x: number,
        y: number,
        scale: number,
        animated: boolean = false
    ): Promise<void> {
        const targetTransform: TransformState = { x, y, scale };

        if (animated) {
            await this.animateToTransform(targetTransform, { animated: true });
        } else {
            this.applyTransform(targetTransform);
            this.currentTransform = targetTransform;
        }
    }

    /**
     * Update node positions for focus calculations
     */
    updateNodePositions(positions: Map<string, { x: number; y: number; size?: number }>): void {
        this.nodePositions.clear();

        for (const [nodeId, pos] of positions.entries()) {
            this.nodePositions.set(nodeId, {
                id: nodeId,
                x: pos.x,
                y: pos.y,
                size: pos.size || 20
            });
        }
    }

    /**
     * Update viewport size from SVG element
     */
    updateViewportSize(): void {
        if (this.svgElement) {
            const rect = this.svgElement.getBoundingClientRect();
            this.viewportSize = {
                width: rect.width || 800,
                height: rect.height || 600
            };
        }
    }

    /**
     * Calculate bounds for a set of positions
     */
    private calculateBounds(positions: NodePosition[]): ViewBounds {
        if (positions.length === 0) {
            return {
                minX: 0,
                maxX: 0,
                minY: 0,
                maxY: 0,
                width: 0,
                height: 0,
                center: { x: 0, y: 0 }
            };
        }

        let minX = positions[0].x;
        let maxX = positions[0].x;
        let minY = positions[0].y;
        let maxY = positions[0].y;

        for (const pos of positions) {
            const nodeSize = (pos.size || 20) / 2;
            minX = Math.min(minX, pos.x - nodeSize);
            maxX = Math.max(maxX, pos.x + nodeSize);
            minY = Math.min(minY, pos.y - nodeSize);
            maxY = Math.max(maxY, pos.y + nodeSize);
        }

        const width = maxX - minX;
        const height = maxY - minY;

        return {
            minX,
            maxX,
            minY,
            maxY,
            width,
            height,
            center: {
                x: minX + width / 2,
                y: minY + height / 2
            }
        };
    }

    /**
     * Calculate target transform to fit bounds in view
     */
    private calculateTargetTransform(bounds: ViewBounds, options: FocusOptions): TransformState {
        const padding = options.padding || 50;
        const offset = options.offset || { x: 0, y: 0 };

        // Calculate scale to fit bounds with padding
        let targetScale = options.scale;
        if (!targetScale) {
            const scaleX = (this.viewportSize.width - padding * 2) / bounds.width;
            const scaleY = (this.viewportSize.height - padding * 2) / bounds.height;
            targetScale = Math.min(scaleX, scaleY, 2); // Cap maximum zoom
            targetScale = Math.max(targetScale, 0.1); // Cap minimum zoom
        }

        // Calculate translation to center bounds in viewport
        const centerX = bounds.center.x;
        const centerY = bounds.center.y;

        const targetX = this.viewportSize.width / 2 - centerX * targetScale + offset.x;
        const targetY = this.viewportSize.height / 2 - centerY * targetScale + offset.y;

        return {
            x: targetX,
            y: targetY,
            scale: targetScale
        };
    }

    /**
     * Animate to target transform with easing
     */
    private async animateToTransform(
        targetTransform: TransformState,
        options: FocusOptions
    ): Promise<void> {
        if (!options.animated) {
            this.applyTransform(targetTransform);
            this.currentTransform = targetTransform;
            return;
        }

        // Stop any existing animation
        this.stopAnimation();

        const duration = options.duration || 800;
        const easing = options.easing || 'ease-out';
        const startTransform = { ...this.currentTransform };
        const startTime = Date.now();

        return new Promise<void>(resolve => {
            this.animationState = {
                active: true,
                startTime,
                duration,
                from: startTransform,
                to: targetTransform,
                easing,
                onComplete: resolve
            };

            const animate = () => {
                if (!this.animationState?.active) {
                    resolve();
                    return;
                }

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = this.applyEasing(progress, easing);

                // Interpolate between start and target transforms
                const currentTransform: TransformState = {
                    x: this.lerp(startTransform.x, targetTransform.x, easedProgress),
                    y: this.lerp(startTransform.y, targetTransform.y, easedProgress),
                    scale: this.lerp(startTransform.scale, targetTransform.scale, easedProgress)
                };

                this.applyTransform(currentTransform);
                this.currentTransform = currentTransform;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.animationState.active = false;
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Apply transform to DOM element
     */
    private applyTransform(transform: TransformState): void {
        if (this.transformGroup) {
            const { x, y, scale } = transform;
            this.transformGroup.setAttribute('transform', `translate(${x}, ${y}) scale(${scale})`);
        }
    }

    /**
     * Apply easing function to progress value
     */
    private applyEasing(progress: number, easing: EasingFunction): number {
        const easingFn = EASING_FUNCTIONS[easing];
        return easingFn ? easingFn(progress) : progress;
    }

    /**
     * Linear interpolation between two values
     */
    private lerp(start: number, end: number, progress: number): number {
        return start + (end - start) * progress;
    }

    /**
     * Emit focus change event
     */
    private emitFocusChange(
        nodeIds: string[],
        transform: TransformState,
        options: FocusOptions
    ): void {
        if (!this.onFocusChange) return;

        const event: FocusEvent = {
            type: 'focusChanged',
            targetNodes: nodeIds,
            transform,
            options,
            timestamp: Date.now()
        };

        // Use a small delay to allow for batching
        if (typeof setTimeout !== 'undefined') {
            setTimeout(() => this.onFocusChange!(event), 0);
        } else {
            // For testing environment without setTimeout
            this.onFocusChange!(event);
        }
    }
}
