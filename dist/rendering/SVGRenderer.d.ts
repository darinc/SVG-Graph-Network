import { Node } from '../Node';
import { Vector } from '../Vector';
import { NodeData, LinkData, TransformState, SVGElements, Bounds } from '../types/index';
/**
 * Link representation for rendering
 */
export interface RenderLink<T extends NodeData = NodeData> {
    source: Node<T>;
    target: Node<T>;
    label?: string;
    weight?: number;
    line_type?: 'solid' | 'dashed' | 'dotted';
}
/**
 * Node element structure in the DOM
 */
export interface NodeElements {
    group: SVGGElement;
    shape: SVGElement;
    text: SVGTextElement;
    hiddenIndicator?: SVGElement;
}
/**
 * Link element structure in the DOM
 */
export interface LinkElements {
    linkEl: SVGLineElement;
    labelText: SVGTextElement;
    labelBackground: SVGRectElement;
}
/**
 * Rendering configuration options
 */
export interface RendererConfig {
    /** Show edge labels */
    showLabels?: boolean;
    /** Animation duration in milliseconds */
    animationDuration?: number;
    /** Text font family */
    fontFamily?: string;
    /** Text font size */
    fontSize?: number;
    /** Enable debug mode */
    debug?: boolean;
}
/**
 * SVGRenderer - Handles all SVG creation, manipulation, and rendering
 * Enhanced with full TypeScript support and comprehensive rendering capabilities
 */
export declare class SVGRenderer {
    private readonly container;
    private readonly containerId;
    private readonly config;
    private canvas;
    private svg;
    private transformGroup;
    private linkGroup;
    private nodeGroup;
    private labelGroup;
    private readonly nodeElements;
    private readonly linkElements;
    private transformState;
    private textCanvas;
    private textContext;
    /**
     * Create a new SVGRenderer instance
     * @param container - DOM container element
     * @param containerId - Unique identifier for this container
     * @param config - Renderer configuration options
     */
    constructor(container: HTMLElement, containerId: string, config?: RendererConfig);
    /**
     * Initialize SVG container and structure
     */
    initialize(): void;
    /**
     * Create main SVG container and groups
     */
    private createSVGContainer;
    /**
     * Create arrowhead marker for links
     */
    private createArrowMarker;
    /**
     * Setup text measurement utilities
     */
    private setupTextMeasurement;
    /**
     * Measure text width for dynamic node sizing
     * @param text - Text to measure
     * @returns Width of the text in pixels
     */
    measureTextWidth(text: string): number;
    /**
     * Create SVG elements for all nodes and links
     * @param nodes - Map of nodes by ID
     * @param links - Array of render links
     */
    createElements<T extends NodeData>(nodes: Map<string, Node<T>>, links: RenderLink<T>[]): void;
    /**
     * Create SVG elements for links
     * @private
     */
    private createLinkElements;
    /**
     * Create SVG elements for nodes
     * @private
     */
    private createNodeElements;
    /**
     * Create shape element for a node based on its shape type
     * @private
     */
    private createNodeShape;
    /**
     * Create text element for a node
     * @private
     */
    private createNodeText;
    /**
     * Update positions of all elements during animation
     * @param nodes - Map of nodes by ID
     * @param links - Array of render links
     * @param filteredNodes - Set of visible node IDs (null = all visible)
     */
    render<T extends NodeData>(nodes: Map<string, Node<T>>, links: RenderLink<T>[], filteredNodes?: Set<string> | null): void;
    /**
     * Update link positions and edge intersections
     * @private
     */
    private updateLinkPositions;
    /**
     * Update label background size and position
     * @private
     */
    private updateLabelBackground;
    /**
     * Update node positions and visibility
     * @private
     */
    private updateNodePositions;
    /**
     * Update transform state for pan/zoom
     * @param x - X translation
     * @param y - Y translation
     * @param scale - Scale factor
     */
    setTransform(x: number, y: number, scale: number): void;
    /**
     * Get current transform state
     * @returns Copy of the current transform state
     */
    getTransform(): TransformState;
    /**
     * Update SVG dimensions on container resize
     * @param width - New container width
     * @param height - New container height
     */
    resize(width: number, height: number): void;
    /**
     * Clear all SVG elements
     */
    clearElements(): void;
    /**
     * Get SVG element for external event binding
     * @returns The SVG element or null if not initialized
     */
    getSVGElement(): SVGSVGElement | null;
    /**
     * Get all SVG elements for external access
     * @returns SVG elements object or null if not initialized
     */
    getSVGElements(): SVGElements | null;
    /**
     * Get node elements map for external access
     * @returns Read-only map of node elements
     */
    getNodeElements(): ReadonlyMap<Node, NodeElements>;
    /**
     * Get link elements map for external access
     * @returns Read-only map of link elements
     */
    getLinkElements(): ReadonlyMap<RenderLink, LinkElements>;
    /**
     * Get bounding box of all nodes
     * @param nodes - Map of nodes by ID
     * @param filteredNodes - Set of visible node IDs (null = all visible)
     * @returns Bounding box containing all nodes
     */
    getBounds<T extends NodeData>(nodes: Map<string, Node<T>>, filteredNodes?: Set<string> | null): Bounds;
    /**
     * Convert screen coordinates to SVG coordinates
     * @param screenX - Screen X coordinate
     * @param screenY - Screen Y coordinate
     * @returns SVG coordinates
     */
    screenToSVG(screenX: number, screenY: number): Vector;
    /**
     * Convert SVG coordinates to screen coordinates
     * @param svgX - SVG X coordinate
     * @param svgY - SVG Y coordinate
     * @returns Screen coordinates
     */
    svgToScreen(svgX: number, svgY: number): Vector;
    /**
     * Create a render link from link data
     * @param linkData - Link data with source/target node IDs
     * @param nodes - Map of nodes by ID
     * @returns Render link object or null if nodes not found
     */
    static createRenderLink<T extends NodeData>(linkData: LinkData, nodes: Map<string, Node<T>>): RenderLink<T> | null;
    /**
     * Create multiple render links from link data
     * @param linkDataArray - Array of link data
     * @param nodes - Map of nodes by ID
     * @returns Array of valid render links
     */
    static createRenderLinks<T extends NodeData>(linkDataArray: LinkData[], nodes: Map<string, Node<T>>): RenderLink<T>[];
    /**
     * Convert this renderer to a serializable object for debugging
     * @returns Object representation of the renderer state
     */
    toObject(): {
        config: RendererConfig;
        transformState: TransformState;
        elementCounts: {
            nodes: number;
            links: number;
        };
        type: string;
        version: string;
    };
    /**
     * Clean up resources and remove from DOM
     */
    destroy(): void;
    /**
     * Create a string representation of the renderer
     * @returns String representation
     */
    toString(): string;
}
//# sourceMappingURL=SVGRenderer.d.ts.map