import { TransformState } from '../../types/index';

/**
 * Convert screen (client) coordinates to graph (SVG) coordinates.
 * Single source of truth for the screen→graph transform used by
 * mouse handlers, touch handlers, and the renderer.
 */
export function screenToGraph(
    clientX: number,
    clientY: number,
    svgRect: DOMRect,
    transform: TransformState
): { x: number; y: number } {
    return {
        x: (clientX - svgRect.left - transform.x) / transform.scale,
        y: (clientY - svgRect.top - transform.y) / transform.scale
    };
}

/**
 * Convert screen coordinates to container-relative coordinates
 * (before transform is applied). Used for zoom center calculations.
 */
export function screenToContainer(
    clientX: number,
    clientY: number,
    svgRect: DOMRect
): { x: number; y: number } {
    return {
        x: clientX - svgRect.left,
        y: clientY - svgRect.top
    };
}
