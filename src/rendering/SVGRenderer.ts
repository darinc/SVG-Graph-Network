import { Node } from '../Node';
import { Vector } from '../Vector';
import { NodeData, LinkData, TransformState, SVGElements, Bounds } from '../types/index';
import { ThemeManager, VisualState } from '../theming/ThemeManager';
import { NodeShapeFactory } from './NodeShapeFactory';

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
export class SVGRenderer {
    private readonly container: HTMLElement;
    private readonly containerId: string;
    private readonly config: RendererConfig;
    private readonly themeManager: ThemeManager;
    private readonly shapeFactory: NodeShapeFactory;

    // SVG elements
    private canvas: HTMLDivElement | null = null;
    private svg: SVGSVGElement | null = null;
    private transformGroup: SVGGElement | null = null;
    private linkGroup: SVGGElement | null = null;
    private nodeGroup: SVGGElement | null = null;
    private labelGroup: SVGGElement | null = null;

    // Element tracking
    private readonly nodeElements = new Map<Node, NodeElements>();
    private readonly linkElements = new Map<RenderLink, LinkElements>();

    // Transform state
    private transformState: TransformState = {
        x: 0,
        y: 0,
        scale: 1
    };

    // Text measurement utilities
    private textCanvas: HTMLCanvasElement | null = null;
    private textContext: CanvasRenderingContext2D | null = null;

    /**
     * Create a new SVGRenderer instance
     * @param container - DOM container element
     * @param containerId - Unique identifier for this container
     * @param themeManager - Theme manager instance
     * @param config - Renderer configuration options
     */
    constructor(
        container: HTMLElement,
        containerId: string,
        themeManager: ThemeManager,
        config: RendererConfig = {}
    ) {
        this.container = container;
        this.containerId = containerId;
        this.themeManager = themeManager;
        this.shapeFactory = new NodeShapeFactory();
        this.config = {
            showLabels: true,
            animationDuration: 300,
            fontFamily: 'Arial',
            fontSize: 14,
            debug: false,
            ...config
        };
    }

    /**
     * Initialize SVG container and structure
     */
    initialize(): void {
        this.createSVGContainer();
        this.setupTextMeasurement();
    }

    /**
     * Create main SVG container and groups
     */
    private createSVGContainer(): void {
        // Remove any existing canvas/SVG (for HMR)
        const existingCanvas = this.container.querySelector('.graph-network-canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }

        const rect = this.container.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;

        // Create canvas wrapper for grid background
        this.canvas = document.createElement('div');
        this.canvas.className = 'graph-network-canvas';
        this.container.appendChild(this.canvas);

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', containerWidth.toString());
        this.svg.setAttribute('height', containerHeight.toString());
        this.svg.style.display = 'block';
        this.svg.style.backgroundColor = 'var(--bg-primary)';

        // Create transform group for pan/zoom
        this.transformGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.transformGroup.classList.add('transform-group');

        // Create layer groups
        this.linkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.linkGroup.classList.add('links');

        this.labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.labelGroup.classList.add('edge-labels');

        this.nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.nodeGroup.classList.add('nodes');

        // Add groups to transform group in correct order (links, labels, nodes)
        this.transformGroup.appendChild(this.linkGroup);
        this.transformGroup.appendChild(this.labelGroup);
        this.transformGroup.appendChild(this.nodeGroup);

        this.svg.appendChild(this.transformGroup);

        // Create arrowhead marker
        this.createArrowMarker();

        this.canvas.appendChild(this.svg);
    }

    /**
     * Create arrowhead marker for links
     */
    private createArrowMarker(): void {
        if (!this.svg) return;

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', `arrowhead-${this.containerId}`);
        marker.setAttribute('viewBox', '0 -5 10 10');
        marker.setAttribute('refX', '8');
        marker.setAttribute('refY', '0');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('markerUnits', 'strokeWidth');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0,-5L10,0L0,5');
        path.setAttribute('fill', '#5a5a5a');

        marker.appendChild(path);
        defs.appendChild(marker);
        this.svg.appendChild(defs);
    }

    /**
     * Setup text measurement utilities
     */
    private setupTextMeasurement(): void {
        this.textCanvas = document.createElement('canvas');
        this.textContext = this.textCanvas.getContext('2d');
        if (this.textContext) {
            this.textContext.font = `${this.config.fontSize}px ${this.config.fontFamily}`;
        }
    }

    /**
     * Measure text width for dynamic node sizing
     * @param text - Text to measure
     * @returns Width of the text in pixels
     */
    measureTextWidth(text: string): number {
        if (!this.textContext) return text.length * 8; // Fallback
        return this.textContext.measureText(text).width;
    }

    /**
     * Create SVG elements for all nodes and links
     * @param nodes - Map of nodes by ID
     * @param links - Array of render links
     */
    createElements<T extends NodeData>(nodes: Map<string, Node<T>>, links: RenderLink<T>[]): void {
        // Ensure SVG structure exists before creating elements
        if (!this.linkGroup || !this.labelGroup || !this.nodeGroup) {
            this.createSVGContainer();
        }

        this.clearElements();

        // Apply canvas theming
        this.applyCanvasTheming();

        this.createLinkElements(links);
        this.createNodeElements(nodes);
    }

    /**
     * Create SVG elements for links
     * @private
     */
    private createLinkElements<T extends NodeData>(links: RenderLink<T>[]): void {
        if (!this.linkGroup || !this.labelGroup) return;

        links.forEach(link => {
            const linkEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            linkEl.classList.add('link');
            linkEl.setAttribute('marker-end', `url(#arrowhead-${this.containerId})`);
            linkEl.setAttribute('data-id', `${link.source.getId()}-${link.target.getId()}`);

            // Apply theme-based edge styling
            this.applyEdgeStyles(
                linkEl,
                link.line_type || 'default',
                `${link.source.getId()}-${link.target.getId()}`
            );

            // Apply additional styling from data
            if (link.weight) {
                linkEl.style.strokeWidth = `${link.weight}px`;
            }
            if (link.line_type === 'dashed') {
                linkEl.style.strokeDasharray = '5, 5';
            } else if (link.line_type === 'dotted') {
                linkEl.style.strokeDasharray = '2, 2';
            }

            this.linkGroup!.appendChild(linkEl);

            // Create label background rectangle for better readability
            const labelBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            labelBackground.classList.add('edge-label-background');
            this.labelGroup!.appendChild(labelBackground);

            const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            labelText.textContent = link.label || '';
            labelText.classList.add('edge-label-text');

            // Apply theme styling to edge labels
            const foregroundColor = this.themeManager.getColor('foreground');
            const backgroundColor = this.themeManager.getColor('background');
            if (foregroundColor) {
                labelText.style.fill = foregroundColor;
            }
            if (backgroundColor) {
                labelBackground.style.fill = backgroundColor;
            }

            this.labelGroup!.appendChild(labelText);

            this.linkElements.set(link, { linkEl, labelText, labelBackground });
        });
    }

    /**
     * Create SVG elements for nodes
     * @private
     */
    private createNodeElements<T extends NodeData>(nodes: Map<string, Node<T>>): void {
        if (!this.nodeGroup) return;

        const nodesArray = Array.from(nodes.values());

        nodesArray.forEach(node => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('data-id', node.getId());

            const { shapeElement, hiddenIndicator } = this.createNodeShape(node);
            const textElement = this.createNodeText(node);

            // Apply theme-based node styling
            this.applyNodeStyles(shapeElement, node.data.type || 'default', node.getId());

            // Apply text styling from theme
            const foregroundColor = this.themeManager.getColor('foreground');
            if (foregroundColor) {
                textElement.style.fill = foregroundColor;
            }

            // Assemble node group
            if (hiddenIndicator) {
                group.appendChild(hiddenIndicator);
            }
            group.appendChild(shapeElement);
            group.appendChild(textElement);

            this.nodeGroup!.appendChild(group);
            this.nodeElements.set(node, {
                group,
                shape: shapeElement,
                text: textElement,
                hiddenIndicator
            });
        });
    }

    /**
     * Create shape element for a node using factory pattern
     * @private
     */
    private createNodeShape<T extends NodeData>(
        node: Node<T>
    ): { shapeElement: SVGElement; hiddenIndicator?: SVGElement } {
        // Use factory to create shape - this reduces cyclomatic complexity from 12 to 3
        const result = this.shapeFactory.createShape(node);

        // Apply theme-based styling
        const nodeType = node.getType();
        this.applyNodeStyles(result.shapeElement, nodeType || 'default', node.getId());

        return result;
    }

    /**
     * Create text element for a node
     * @private
     */
    private createNodeText<T extends NodeData>(node: Node<T>): SVGTextElement {
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.textContent = node.getName();
        textElement.classList.add('node-label');
        textElement.setAttribute('text-anchor', 'middle');
        textElement.setAttribute('dominant-baseline', 'central');

        return textElement;
    }

    /**
     * Apply theme-based styles to a node element
     * @private
     */
    private applyNodeStyles(element: SVGElement, nodeType: string, nodeId: string): void {
        const states = this.themeManager.getElementStates(nodeId);
        const style = this.themeManager.getNodeStyle(nodeType, states);

        // Apply each style attribute
        Object.entries(style).forEach(([attr, value]) => {
            if (value !== undefined) {
                element.setAttribute(attr, String(value));
            }
        });
    }

    /**
     * Apply theme-based styles to an edge element
     * @private
     */
    private applyEdgeStyles(element: SVGElement, edgeType: string, edgeId: string): void {
        const states = this.themeManager.getElementStates(edgeId);
        const style = this.themeManager.getEdgeStyle(edgeType, states);

        // Apply each style attribute
        Object.entries(style).forEach(([attr, value]) => {
            if (value !== undefined) {
                element.setAttribute(attr, String(value));
            }
        });
    }

    /**
     * Apply canvas theming
     */
    public applyCanvasTheming(): void {
        const canvasConfig = this.themeManager.getCanvasConfig();

        if (this.svg) {
            // Apply background color
            if (canvasConfig.background) {
                this.svg.style.backgroundColor = canvasConfig.background;
            }

            // Apply grid pattern
            if (canvasConfig.showGrid && canvasConfig.gridColor && canvasConfig.gridSize) {
                const gridSize = canvasConfig.gridSize;
                const gridColor = canvasConfig.gridColor;

                const backgroundImage = `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`;

                this.svg.style.backgroundImage = backgroundImage;
                this.svg.style.backgroundSize = `${gridSize}px ${gridSize}px`;

                console.log(
                    `Applied grid pattern: ${gridColor} at ${gridSize}px for theme: ${this.themeManager.getCurrentTheme().name}`
                );
            } else {
                // Remove grid if disabled
                this.svg.style.backgroundImage = '';
                this.svg.style.backgroundSize = '';
            }
        }
    }

    /**
     * Update element visual state
     */
    updateElementState(elementId: string, state: VisualState, enabled: boolean): void {
        this.themeManager.setElementState(elementId, state, enabled);

        // Re-apply styles for the element
        // Find the element and re-apply its styles
        const element = this.svg?.querySelector(`[data-id="${elementId}"]`);
        if (element) {
            const isNode = element.classList.contains('node-shape');
            const isEdge = element.classList.contains('link');

            if (isNode) {
                const nodeType = element.getAttribute('data-type') || 'default';
                this.applyNodeStyles(element as SVGElement, nodeType, elementId);
            } else if (isEdge) {
                const edgeType = element.getAttribute('data-type') || 'default';
                this.applyEdgeStyles(element as SVGElement, edgeType, elementId);
            }
        }
    }

    /**
     * Get the theme manager instance
     */
    getThemeManager(): ThemeManager {
        return this.themeManager;
    }

    /**
     * Update positions of all elements during animation
     * @param nodes - Map of nodes by ID
     * @param links - Array of render links
     * @param filteredNodes - Set of visible node IDs (null = all visible)
     */
    render<T extends NodeData>(
        nodes: Map<string, Node<T>>,
        links: RenderLink<T>[],
        filteredNodes: Set<string> | null = null
    ): void {
        // Update transform for pan/zoom
        if (this.transformGroup) {
            this.transformGroup.style.transform = `translate(${this.transformState.x}px, ${this.transformState.y}px) scale(${this.transformState.scale})`;
        }

        // Synchronize background transform if enabled
        this.updateBackgroundTransform();

        // Update link positions
        this.updateLinkPositions(links, filteredNodes);

        // Update node positions and visibility
        this.updateNodePositions(nodes, filteredNodes);
    }

    /**
     * Update link positions and edge intersections
     * @private
     */
    private updateLinkPositions<T extends NodeData>(
        links: RenderLink<T>[],
        filteredNodes: Set<string> | null = null
    ): void {
        links.forEach(link => {
            const elements = this.linkElements.get(link);
            if (!elements) return;

            // Handle filtering visibility for links
            const isVisible =
                !filteredNodes ||
                (filteredNodes.has(link.source.getId()) && filteredNodes.has(link.target.getId()));

            elements.linkEl.style.opacity = isVisible ? '1' : '0.1';
            elements.labelText.style.opacity = isVisible ? '1' : '0.1';
            elements.labelBackground.style.opacity = isVisible ? '1' : '0.1';

            const sourcePos = link.source.position;
            const targetPos = link.target.position;
            const diff = targetPos.subtract(sourcePos);
            const distance = diff.magnitude();

            let newX2 = targetPos.x;
            let newY2 = targetPos.y;

            // Calculate edge intersection based on target shape
            if (link.target.getShape() === 'rectangle' && distance > 0) {
                const halfWidth = (link.target.dynamicWidth || link.target.size * 2.8) / 2;
                const halfHeight = (link.target.dynamicHeight || link.target.size * 1.4) / 2;

                const angle = Math.atan2(diff.y, diff.x);
                const absAngle = Math.abs(angle);

                let dx = halfWidth;
                let dy = halfHeight;

                if (
                    absAngle > Math.atan2(halfHeight, halfWidth) &&
                    absAngle < Math.PI - Math.atan2(halfHeight, halfWidth)
                ) {
                    dx = halfHeight / Math.tan(absAngle);
                } else {
                    dy = halfWidth * Math.tan(absAngle);
                }

                newX2 = targetPos.x - dx * Math.sign(diff.x);
                newY2 = targetPos.y - dy * Math.sign(diff.y);
            } else if (link.target.getShape() === 'circle' && distance > link.target.size) {
                const ratio = (distance - link.target.size) / distance;
                newX2 = sourcePos.x + diff.x * ratio;
                newY2 = sourcePos.y + diff.y * ratio;
            }

            // Update link line
            elements.linkEl.setAttribute('x1', sourcePos.x.toString());
            elements.linkEl.setAttribute('y1', sourcePos.y.toString());
            elements.linkEl.setAttribute('x2', newX2.toString());
            elements.linkEl.setAttribute('y2', newY2.toString());

            // Update label position
            if (this.config.showLabels && elements.labelText.textContent) {
                const midX = (sourcePos.x + newX2) / 2;
                const midY = (sourcePos.y + newY2) / 2;
                elements.labelText.setAttribute('x', midX.toString());
                elements.labelText.setAttribute('y', midY.toString());

                // Update label background
                this.updateLabelBackground(elements.labelText, elements.labelBackground);
            }
        });
    }

    /**
     * Update label background size and position
     * @private
     */
    private updateLabelBackground(
        labelText: SVGTextElement,
        labelBackground: SVGRectElement
    ): void {
        if (!labelBackground || !labelText.textContent) return;

        try {
            const textBBox = labelText.getBBox();
            const padding = 4;

            labelBackground.setAttribute('x', (textBBox.x - padding).toString());
            labelBackground.setAttribute('y', (textBBox.y - padding).toString());
            labelBackground.setAttribute('width', (textBBox.width + padding * 2).toString());
            labelBackground.setAttribute('height', (textBBox.height + padding * 2).toString());
        } catch (error) {
            // Handle getBBox errors in some browsers
            if (this.config.debug) {
                console.warn('Could not get text bounding box:', error);
            }
        }
    }

    /**
     * Update node positions and visibility
     * @private
     */
    private updateNodePositions<T extends NodeData>(
        nodes: Map<string, Node<T>>,
        filteredNodes: Set<string> | null = null
    ): void {
        Array.from(nodes.values()).forEach(node => {
            const elements = this.nodeElements.get(node);
            if (elements) {
                elements.group.setAttribute(
                    'transform',
                    `translate(${node.position.x},${node.position.y})`
                );

                // Handle filtering visibility for nodes
                const isVisible = !filteredNodes || filteredNodes.has(node.getId());
                elements.group.style.opacity = isVisible ? '1' : '0.1';

                // Show/hide connection indicator for nodes with filtered connections
                if (elements.hiddenIndicator) {
                    const hasHiddenConnections = filteredNodes && !filteredNodes.has(node.getId());
                    elements.hiddenIndicator.style.display = hasHiddenConnections
                        ? 'block'
                        : 'none';
                }
            }
        });
    }

    /**
     * Update transform state for pan/zoom
     * @param x - X translation
     * @param y - Y translation
     * @param scale - Scale factor
     */
    setTransform(x: number, y: number, scale: number): void {
        this.transformState.x = x;
        this.transformState.y = y;
        this.transformState.scale = scale;
    }

    /**
     * Get current transform state
     * @returns Copy of the current transform state
     */
    getTransform(): TransformState {
        return { ...this.transformState };
    }

    /**
     * Update SVG dimensions on container resize
     * @param width - New container width
     * @param height - New container height
     */
    resize(width: number, height: number): void {
        if (this.svg) {
            this.svg.setAttribute('width', width.toString());
            this.svg.setAttribute('height', height.toString());
        }
    }

    /**
     * Clear all SVG elements
     */
    clearElements(): void {
        // Clear groups with null safety checks
        if (this.linkGroup) {
            this.linkGroup.innerHTML = '';
        }
        if (this.labelGroup) {
            this.labelGroup.innerHTML = '';
        }
        if (this.nodeGroup) {
            this.nodeGroup.innerHTML = '';
        }

        // Clear tracking maps
        this.nodeElements.clear();
        this.linkElements.clear();
    }

    /**
     * Get SVG element for external event binding
     * @returns The SVG element or null if not initialized
     */
    getSVGElement(): SVGSVGElement | null {
        return this.svg;
    }

    /**
     * Get all SVG elements for external access
     * @returns SVG elements object or null if not initialized
     */
    getSVGElements(): SVGElements | null {
        if (
            !this.svg ||
            !this.transformGroup ||
            !this.linkGroup ||
            !this.nodeGroup ||
            !this.labelGroup
        ) {
            return null;
        }

        return {
            svg: this.svg,
            transformGroup: this.transformGroup,
            linkGroup: this.linkGroup,
            nodeGroup: this.nodeGroup,
            labelGroup: this.labelGroup
        };
    }

    /**
     * Get node elements map for external access
     * @returns Read-only map of node elements
     */
    getNodeElements(): ReadonlyMap<Node, NodeElements> {
        return this.nodeElements;
    }

    /**
     * Get link elements map for external access
     * @returns Read-only map of link elements
     */
    getLinkElements(): ReadonlyMap<RenderLink, LinkElements> {
        return this.linkElements;
    }

    /**
     * Get bounding box of all nodes
     * @param nodes - Map of nodes by ID
     * @param filteredNodes - Set of visible node IDs (null = all visible)
     * @returns Bounding box containing all nodes
     */
    getBounds<T extends NodeData>(
        nodes: Map<string, Node<T>>,
        filteredNodes: Set<string> | null = null
    ): Bounds {
        const nodesArray = Array.from(nodes.values());
        const activeNodes = filteredNodes
            ? nodesArray.filter(node => filteredNodes.has(node.getId()))
            : nodesArray;

        if (activeNodes.length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;

        activeNodes.forEach(node => {
            const radius = node.getEffectiveRadius();
            minX = Math.min(minX, node.position.x - radius);
            minY = Math.min(minY, node.position.y - radius);
            maxX = Math.max(maxX, node.position.x + radius);
            maxY = Math.max(maxY, node.position.y + radius);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * Convert screen coordinates to SVG coordinates
     * @param screenX - Screen X coordinate
     * @param screenY - Screen Y coordinate
     * @returns SVG coordinates
     */
    screenToSVG(screenX: number, screenY: number): Vector {
        if (!this.svg) return new Vector(screenX, screenY);

        const rect = this.svg.getBoundingClientRect();
        const svgX = (screenX - rect.left - this.transformState.x) / this.transformState.scale;
        const svgY = (screenY - rect.top - this.transformState.y) / this.transformState.scale;

        return new Vector(svgX, svgY);
    }

    /**
     * Convert SVG coordinates to screen coordinates
     * @param svgX - SVG X coordinate
     * @param svgY - SVG Y coordinate
     * @returns Screen coordinates
     */
    svgToScreen(svgX: number, svgY: number): Vector {
        if (!this.svg) return new Vector(svgX, svgY);

        const rect = this.svg.getBoundingClientRect();
        const screenX = svgX * this.transformState.scale + this.transformState.x + rect.left;
        const screenY = svgY * this.transformState.scale + this.transformState.y + rect.top;

        return new Vector(screenX, screenY);
    }

    /**
     * Create a render link from link data
     * @param linkData - Link data with source/target node IDs
     * @param nodes - Map of nodes by ID
     * @returns Render link object or null if nodes not found
     */
    static createRenderLink<T extends NodeData>(
        linkData: LinkData,
        nodes: Map<string, Node<T>>
    ): RenderLink<T> | null {
        const source = nodes.get(linkData.source);
        const target = nodes.get(linkData.target);

        if (!source || !target) return null;

        return {
            source,
            target,
            label: linkData.label,
            weight: linkData.weight,
            line_type: linkData.line_type
        };
    }

    /**
     * Create multiple render links from link data
     * @param linkDataArray - Array of link data
     * @param nodes - Map of nodes by ID
     * @returns Array of valid render links
     */
    static createRenderLinks<T extends NodeData>(
        linkDataArray: LinkData[],
        nodes: Map<string, Node<T>>
    ): RenderLink<T>[] {
        return linkDataArray
            .map(data => SVGRenderer.createRenderLink(data, nodes))
            .filter((link): link is RenderLink<T> => link !== null);
    }

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
    } {
        return {
            config: this.config,
            transformState: this.transformState,
            elementCounts: {
                nodes: this.nodeElements.size,
                links: this.linkElements.size
            },
            type: 'SVGRenderer',
            version: '2.0.0'
        };
    }

    /**
     * Clean up resources and remove from DOM
     */
    destroy(): void {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        this.clearElements();

        // Clear all references
        this.canvas = null;
        this.svg = null;
        this.transformGroup = null;
        this.linkGroup = null;
        this.nodeGroup = null;
        this.labelGroup = null;
        this.textCanvas = null;
        this.textContext = null;
    }

    /**
     * Update background transform to synchronize with graph transforms
     * Applies zoom and pan transforms to the background grid pattern
     */
    private updateBackgroundTransform(): void {
        if (!this.svg) return;

        const canvasConfig = this.themeManager.getCanvasConfig();

        // Only apply background transform if sync is enabled and grid is shown
        if (!canvasConfig.syncBackgroundTransform || !canvasConfig.showGrid) {
            return;
        }

        const { scale, x, y } = this.transformState;

        // Apply transform to background position and size
        // The background moves opposite to the graph transform to create synchronized movement
        const backgroundPositionX = x * scale;
        const backgroundPositionY = y * scale;
        const backgroundSize = (canvasConfig.gridSize || 20) * scale;

        this.svg.style.backgroundPosition = `${backgroundPositionX}px ${backgroundPositionY}px`;
        this.svg.style.backgroundSize = `${backgroundSize}px ${backgroundSize}px`;
    }

    /**
     * Create a string representation of the renderer
     * @returns String representation
     */
    toString(): string {
        return `SVGRenderer(container: ${this.containerId}, nodes: ${this.nodeElements.size}, links: ${this.linkElements.size})`;
    }
}
