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
import { ICameraController, FocusOptions, ViewBounds, FocusEvent } from '../types/styling';
/**
 * Focus change callback type
 */
export type FocusChangeCallback = (event: FocusEvent) => void;
/**
 * CameraController handles all view focus and animation operations
 */
export declare class CameraController implements ICameraController {
    private currentTransform;
    private animationState;
    private readonly onFocusChange?;
    private nodePositions;
    private viewportSize;
    private svgElement?;
    private transformGroup?;
    /**
     * Create a new CameraController
     * @param onFocusChange - Callback for focus changes
     */
    constructor(onFocusChange?: FocusChangeCallback);
    /**
     * Initialize with SVG elements
     */
    initialize(svgElement: SVGSVGElement, transformGroup: SVGGElement): void;
    /**
     * Focus on a single node with smooth animation
     */
    focusOnNode(nodeId: string, options?: FocusOptions): Promise<void>;
    /**
     * Focus on multiple nodes by fitting them in view
     */
    focusOnNodes(nodeIds: string[], options?: FocusOptions): Promise<void>;
    /**
     * Fit entire graph to view with padding
     */
    fitToView(padding?: number): Promise<void>;
    /**
     * Center the view on the graph center
     */
    centerView(): Promise<void>;
    /**
     * Get current view bounds in graph coordinates
     */
    getViewBounds(): ViewBounds;
    /**
     * Check if animation is currently running
     */
    isAnimating(): boolean;
    /**
     * Stop current animation
     */
    stopAnimation(): void;
    /**
     * Set transform directly with optional animation
     */
    setTransform(x: number, y: number, scale: number, animated?: boolean): Promise<void>;
    /**
     * Update node positions for focus calculations
     */
    updateNodePositions(positions: Map<string, {
        x: number;
        y: number;
        size?: number;
    }>): void;
    /**
     * Update viewport size from SVG element
     */
    updateViewportSize(): void;
    /**
     * Calculate bounds for a set of positions
     */
    private calculateBounds;
    /**
     * Calculate target transform to fit bounds in view
     */
    private calculateTargetTransform;
    /**
     * Animate to target transform with easing
     */
    private animateToTransform;
    /**
     * Apply transform to DOM element
     */
    private applyTransform;
    /**
     * Apply easing function to progress value
     */
    private applyEasing;
    /**
     * Linear interpolation between two values
     */
    private lerp;
    /**
     * Emit focus change event
     */
    private emitFocusChange;
}
//# sourceMappingURL=CameraController.d.ts.map