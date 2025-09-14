/**
 * CoordinateConverter - Handles coordinate system conversions
 *
 * Extracted from EventManager to provide focused responsibility for:
 * - Screen to SVG coordinate conversion
 * - SVG to screen coordinate conversion
 * - Viewport-aware coordinate transformations
 * - Bounds checking and validation
 */

import { Vector } from '../../Vector';
import { TransformState, Position } from '../../types/index';

export interface CoordinateSystem {
    /** Transform state for conversions */
    transform: TransformState;
    /** SVG element for bounds reference */
    svg: SVGSVGElement;
}

/**
 * Handles coordinate system conversions between screen and SVG space
 */
export class CoordinateConverter {
    private svg: SVGSVGElement | null = null;
    private transformState: TransformState;

    constructor(transformState: TransformState) {
        this.transformState = transformState;
    }

    /**
     * Initialize with SVG element
     */
    initialize(svg: SVGSVGElement): void {
        this.svg = svg;
    }

    /**
     * Convert screen coordinates to SVG coordinates
     */
    screenToSVG(screenX: number, screenY: number): Vector {
        if (!this.svg) {
            return new Vector(screenX, screenY);
        }

        const rect = this.svg.getBoundingClientRect();
        const svgX = (screenX - rect.left - this.transformState.x) / this.transformState.scale;
        const svgY = (screenY - rect.top - this.transformState.y) / this.transformState.scale;

        return new Vector(svgX, svgY);
    }

    /**
     * Convert SVG coordinates to screen coordinates
     */
    svgToScreen(svgX: number, svgY: number): Vector {
        if (!this.svg) {
            return new Vector(svgX, svgY);
        }

        const rect = this.svg.getBoundingClientRect();
        const screenX = svgX * this.transformState.scale + this.transformState.x + rect.left;
        const screenY = svgY * this.transformState.scale + this.transformState.y + rect.top;

        return new Vector(screenX, screenY);
    }

    /**
     * Convert screen position to SVG position
     */
    screenPositionToSVG(position: Position): Position {
        const converted = this.screenToSVG(position.x, position.y);
        return { x: converted.x, y: converted.y };
    }

    /**
     * Convert SVG position to screen position
     */
    svgPositionToScreen(position: Position): Position {
        const converted = this.svgToScreen(position.x, position.y);
        return { x: converted.x, y: converted.y };
    }

    /**
     * Convert screen rectangle to SVG rectangle
     */
    screenRectToSVG(screenRect: { x: number; y: number; width: number; height: number }): {
        x: number;
        y: number;
        width: number;
        height: number;
    } {
        const topLeft = this.screenToSVG(screenRect.x, screenRect.y);
        const bottomRight = this.screenToSVG(
            screenRect.x + screenRect.width,
            screenRect.y + screenRect.height
        );

        return {
            x: topLeft.x,
            y: topLeft.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
        };
    }

    /**
     * Convert SVG rectangle to screen rectangle
     */
    svgRectToScreen(svgRect: { x: number; y: number; width: number; height: number }): {
        x: number;
        y: number;
        width: number;
        height: number;
    } {
        const topLeft = this.svgToScreen(svgRect.x, svgRect.y);
        const bottomRight = this.svgToScreen(svgRect.x + svgRect.width, svgRect.y + svgRect.height);

        return {
            x: topLeft.x,
            y: topLeft.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
        };
    }

    /**
     * Get mouse/touch position relative to SVG element
     */
    getRelativePosition(event: MouseEvent | Touch): Vector {
        if (!this.svg) {
            return new Vector(0, 0);
        }

        const rect = this.svg.getBoundingClientRect();
        return new Vector(event.clientX - rect.left, event.clientY - rect.top);
    }

    /**
     * Get SVG coordinates from mouse/touch event
     */
    getEventSVGPosition(event: MouseEvent | Touch): Vector {
        const relativePos = this.getRelativePosition(event);
        return this.screenToSVG(relativePos.x, relativePos.y);
    }

    /**
     * Check if screen coordinates are within SVG viewport
     */
    isScreenPointInViewport(screenX: number, screenY: number): boolean {
        if (!this.svg) return false;

        const rect = this.svg.getBoundingClientRect();
        const relativeX = screenX - rect.left;
        const relativeY = screenY - rect.top;

        return (
            relativeX >= 0 && relativeY >= 0 && relativeX <= rect.width && relativeY <= rect.height
        );
    }

    /**
     * Check if SVG coordinates are visible in current viewport
     */
    isSVGPointVisible(svgX: number, svgY: number): boolean {
        const screenPos = this.svgToScreen(svgX, svgY);
        return this.isScreenPointInViewport(screenPos.x, screenPos.y);
    }

    /**
     * Get the visible SVG bounds in current viewport
     */
    getVisibleSVGBounds(): { x: number; y: number; width: number; height: number } | null {
        if (!this.svg) return null;

        const rect = this.svg.getBoundingClientRect();
        const topLeft = this.screenToSVG(0, 0);
        const bottomRight = this.screenToSVG(rect.width, rect.height);

        return {
            x: topLeft.x,
            y: topLeft.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
        };
    }

    /**
     * Get current viewport bounds in screen coordinates
     */
    getViewportBounds(): { x: number; y: number; width: number; height: number } | null {
        if (!this.svg) return null;

        const rect = this.svg.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * Calculate distance between two points in SVG space
     */
    svgDistance(point1: Position, point2: Position): number {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate distance between two points in screen space
     */
    screenDistance(point1: Position, point2: Position): number {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Convert a screen distance to SVG distance
     */
    screenDistanceToSVG(screenDistance: number): number {
        return screenDistance / this.transformState.scale;
    }

    /**
     * Convert an SVG distance to screen distance
     */
    svgDistanceToScreen(svgDistance: number): number {
        return svgDistance * this.transformState.scale;
    }

    /**
     * Get current scale factor
     */
    getScale(): number {
        return this.transformState.scale;
    }

    /**
     * Get current transform state
     */
    getTransform(): TransformState {
        return { ...this.transformState };
    }

    /**
     * Update transform state reference
     */
    updateTransform(transformState: TransformState): void {
        this.transformState = transformState;
    }

    /**
     * Create coordinate system snapshot
     */
    createSnapshot(): CoordinateSystem | null {
        if (!this.svg) return null;

        return {
            transform: { ...this.transformState },
            svg: this.svg
        };
    }

    /**
     * Restore from coordinate system snapshot
     */
    restoreFromSnapshot(snapshot: CoordinateSystem): void {
        this.transformState = snapshot.transform;
        this.svg = snapshot.svg;
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.svg = null;
    }
}
