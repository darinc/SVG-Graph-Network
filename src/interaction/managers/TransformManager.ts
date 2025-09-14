/**
 * TransformManager - Manages viewport transformation operations
 *
 * Extracted from EventManager to provide focused responsibility for:
 * - Transform state management (x, y, scale)
 * - Programmatic zoom operations
 * - Programmatic pan operations
 * - Transform constraints and bounds
 * - Transform update callbacks
 */

import { TransformState } from '../../types/index';
import { EventManagerCallbacks } from '../EventManager';

export interface TransformConfig {
    /** Minimum zoom scale */
    minScale: number;
    /** Maximum zoom scale */
    maxScale: number;
    /** Zoom sensitivity multiplier */
    zoomSensitivity: number;
}

/**
 * Manages viewport transform operations
 */
export class TransformManager {
    private transformState: TransformState;
    private config: TransformConfig;
    private callbacks: EventManagerCallbacks;
    private eventEmitter: { emit: (event: string, data: any) => void };
    private svg: SVGSVGElement | null = null;

    constructor(
        config: Partial<TransformConfig> = {},
        callbacks: EventManagerCallbacks = {},
        eventEmitter: { emit: (event: string, data: any) => void }
    ) {
        this.config = {
            minScale: 0.2,
            maxScale: 2.0,
            zoomSensitivity: 1.01,
            ...config
        };

        this.callbacks = callbacks;
        this.eventEmitter = eventEmitter;

        this.transformState = {
            x: 0,
            y: 0,
            scale: 1
        };
    }

    /**
     * Initialize with SVG reference
     */
    initialize(svg: SVGSVGElement): void {
        this.svg = svg;
    }

    /**
     * Set transform state
     */
    setTransform(x: number, y: number, scale: number): void {
        const constrainedScale = this.constrainScale(scale);

        this.transformState.x = x;
        this.transformState.y = y;
        this.transformState.scale = constrainedScale;

        this.notifyTransformUpdate();
    }

    /**
     * Get current transform state
     */
    getTransform(): TransformState {
        return { ...this.transformState };
    }

    /**
     * Update only the scale component
     */
    setScale(scale: number): void {
        const constrainedScale = this.constrainScale(scale);
        this.transformState.scale = constrainedScale;
        this.notifyTransformUpdate();
    }

    /**
     * Update only the position components
     */
    setPosition(x: number, y: number): void {
        this.transformState.x = x;
        this.transformState.y = y;
        this.notifyTransformUpdate();
    }

    /**
     * Apply relative transform changes
     */
    applyDelta(deltaX: number, deltaY: number, scaleMultiplier: number = 1): void {
        this.transformState.x += deltaX;
        this.transformState.y += deltaY;
        this.transformState.scale = this.constrainScale(
            this.transformState.scale * scaleMultiplier
        );

        this.notifyTransformUpdate();
    }

    /**
     * Programmatically zoom to a specific scale and center
     */
    zoomTo(scale: number, centerX?: number, centerY?: number, animate: boolean = false): void {
        if (!this.svg) return;

        const newScale = this.constrainScale(scale);

        if (centerX !== undefined && centerY !== undefined) {
            const rect = this.svg.getBoundingClientRect();
            const zoomX = centerX - rect.left;
            const zoomY = centerY - rect.top;

            const scaleChange = newScale / this.transformState.scale;
            this.transformState.x = zoomX - (zoomX - this.transformState.x) * scaleChange;
            this.transformState.y = zoomY - (zoomY - this.transformState.y) * scaleChange;
        }

        this.transformState.scale = newScale;
        this.notifyTransformUpdate();

        this.eventEmitter.emit('zoom', {
            scale: this.transformState.scale,
            x: this.transformState.x,
            y: this.transformState.y,
            center: centerX && centerY ? { x: centerX, y: centerY } : undefined,
            animated: animate
        });
    }

    /**
     * Programmatically pan to a specific position
     */
    panTo(x: number, y: number, animate: boolean = false): void {
        const deltaX = x - this.transformState.x;
        const deltaY = y - this.transformState.y;

        this.transformState.x = x;
        this.transformState.y = y;

        this.notifyTransformUpdate();

        this.eventEmitter.emit('pan', {
            x: this.transformState.x,
            y: this.transformState.y,
            deltaX,
            deltaY,
            animated: animate
        });
    }

    /**
     * Zoom by a relative amount towards a center point
     */
    zoomBy(zoomDelta: number, centerX?: number, centerY?: number): void {
        if (!this.svg) return;

        let zoomCenterX = centerX;
        let zoomCenterY = centerY;

        // If no center specified, use SVG center
        if (zoomCenterX === undefined || zoomCenterY === undefined) {
            const rect = this.svg.getBoundingClientRect();
            zoomCenterX = rect.width / 2;
            zoomCenterY = rect.height / 2;
        }

        const newScale = this.constrainScale(this.transformState.scale * zoomDelta);
        const scaleChange = newScale / this.transformState.scale;

        // Zoom towards the specified point
        this.transformState.x = zoomCenterX - (zoomCenterX - this.transformState.x) * scaleChange;
        this.transformState.y = zoomCenterY - (zoomCenterY - this.transformState.y) * scaleChange;
        this.transformState.scale = newScale;

        this.notifyTransformUpdate();

        this.eventEmitter.emit('zoom', {
            scale: this.transformState.scale,
            x: this.transformState.x,
            y: this.transformState.y,
            delta: zoomDelta,
            center: { x: zoomCenterX, y: zoomCenterY }
        });
    }

    /**
     * Pan by relative amounts
     */
    panBy(deltaX: number, deltaY: number): void {
        this.transformState.x += deltaX;
        this.transformState.y += deltaY;

        this.notifyTransformUpdate();

        this.eventEmitter.emit('pan', {
            x: this.transformState.x,
            y: this.transformState.y,
            deltaX,
            deltaY
        });
    }

    /**
     * Reset transform to default state
     */
    reset(): void {
        this.transformState.x = 0;
        this.transformState.y = 0;
        this.transformState.scale = 1;

        this.notifyTransformUpdate();

        this.eventEmitter.emit('transformReset', {
            x: this.transformState.x,
            y: this.transformState.y,
            scale: this.transformState.scale
        });
    }

    /**
     * Fit view to specific bounds
     */
    fitToBounds(
        bounds: { x: number; y: number; width: number; height: number },
        padding: number = 20
    ): void {
        if (!this.svg) return;

        const rect = this.svg.getBoundingClientRect();
        const viewportWidth = rect.width - padding * 2;
        const viewportHeight = rect.height - padding * 2;

        // Calculate scale to fit bounds in viewport
        const scaleX = viewportWidth / bounds.width;
        const scaleY = viewportHeight / bounds.height;
        const scale = this.constrainScale(Math.min(scaleX, scaleY));

        // Calculate position to center the bounds
        const boundsCenter = {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2
        };

        const viewportCenter = {
            x: rect.width / 2,
            y: rect.height / 2
        };

        this.transformState.x = viewportCenter.x - boundsCenter.x * scale;
        this.transformState.y = viewportCenter.y - boundsCenter.y * scale;
        this.transformState.scale = scale;

        this.notifyTransformUpdate();

        this.eventEmitter.emit('fitToBounds', {
            bounds,
            transform: this.getTransform()
        });
    }

    /**
     * Check if a point is visible in current viewport
     */
    isPointVisible(x: number, y: number): boolean {
        if (!this.svg) return false;

        const rect = this.svg.getBoundingClientRect();
        const screenX = x * this.transformState.scale + this.transformState.x;
        const screenY = y * this.transformState.scale + this.transformState.y;

        return screenX >= 0 && screenY >= 0 && screenX <= rect.width && screenY <= rect.height;
    }

    /**
     * Get current zoom level as percentage
     */
    getZoomPercentage(): number {
        return Math.round(this.transformState.scale * 100);
    }

    /**
     * Constrain scale within configured bounds
     * @private
     */
    private constrainScale(scale: number): number {
        return Math.max(this.config.minScale, Math.min(this.config.maxScale, scale));
    }

    /**
     * Notify callbacks about transform update
     * @private
     */
    private notifyTransformUpdate(): void {
        this.callbacks.updateTransform?.(
            this.transformState.x,
            this.transformState.y,
            this.transformState.scale
        );
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<TransformConfig>): void {
        Object.assign(this.config, config);
    }

    /**
     * Get current configuration
     */
    getConfig(): TransformConfig {
        return { ...this.config };
    }

    /**
     * Update callbacks
     */
    updateCallbacks(callbacks: Partial<EventManagerCallbacks>): void {
        Object.assign(this.callbacks, callbacks);
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.svg = null;
    }
}
