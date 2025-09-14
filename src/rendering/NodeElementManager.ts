/**
 * NodeElementManager - Manages node visual elements creation and positioning
 *
 * Extracted from SVGRenderer to focus on node-specific DOM operations.
 * Handles node element creation, positioning, and lifecycle management.
 */

import { Node } from '../Node';
import { NodeData } from '../types/index';
import { ThemeManager, VisualState } from '../theming/ThemeManager';
import { NodeShapeFactory } from './NodeShapeFactory';

/**
 * Node element structure in the DOM
 */
export interface NodeElements {
    group: SVGGElement;
    shape: SVGElement;
    text: SVGTextElement;
    hiddenIndicator?: SVGElement;
}

export interface NodeElementConfig {
    /** Text font family */
    fontFamily?: string;
    /** Text font size */
    fontSize?: number;
    /** Enable debug mode */
    debug?: boolean;
}

/**
 * Manages node visual elements
 */
export class NodeElementManager<T extends NodeData = NodeData> {
    private config: NodeElementConfig;
    private themeManager: ThemeManager;
    private shapeFactory: NodeShapeFactory;
    private nodeGroup: SVGGElement | null = null;

    // Element tracking
    private readonly nodeElements = new Map<Node<T>, NodeElements>();

    // Text measurement context
    private textCanvas: HTMLCanvasElement | null = null;
    private textContext: CanvasRenderingContext2D | null = null;

    constructor(
        config: NodeElementConfig,
        themeManager: ThemeManager,
        shapeFactory: NodeShapeFactory
    ) {
        this.config = config;
        this.themeManager = themeManager;
        this.shapeFactory = shapeFactory;
        this.setupTextMeasurement();
    }

    /**
     * Set the node group container
     */
    setNodeGroup(nodeGroup: SVGGElement | null): void {
        this.nodeGroup = nodeGroup;
    }

    /**
     * Create elements for all nodes
     */
    createNodeElements(nodes: Map<string, Node<T>>): void {
        if (!this.nodeGroup) return;

        // Clear existing elements
        this.clearElements();

        // Create elements for each node
        nodes.forEach(node => {
            const elements = this.createSingleNodeElement(node);
            if (elements) {
                this.nodeElements.set(node, elements);
                this.nodeGroup!.appendChild(elements.group);
            }
        });
    }

    /**
     * Create elements for a single node
     * @private
     */
    private createSingleNodeElement(node: Node<T>): NodeElements | null {
        // Create group container
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('node', 'node-group');
        group.setAttribute('data-id', node.getId());

        // Create shape using factory
        const { shapeElement, hiddenIndicator } = this.createNodeShape(node);

        // Create text element
        const textElement = this.createNodeText(node);

        // Apply theme-based styling
        this.applyNodeStyles(shapeElement, node.getType() || 'default', node.getId());

        // Add elements to group
        group.appendChild(shapeElement);
        group.appendChild(textElement);

        if (hiddenIndicator) {
            group.appendChild(hiddenIndicator);
        }

        return {
            group,
            shape: shapeElement,
            text: textElement,
            hiddenIndicator
        };
    }

    /**
     * Create node shape using factory pattern
     * @private
     */
    private createNodeShape(node: Node<T>): {
        shapeElement: SVGElement;
        hiddenIndicator?: SVGElement;
    } {
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
    private createNodeText(node: Node<T>): SVGTextElement {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.classList.add('node-text');
        text.setAttribute('data-id', node.getId());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('pointer-events', 'none');

        // Set text content
        text.textContent = node.getName() || node.getId();

        // Apply font styling
        if (this.config.fontFamily) {
            text.style.fontFamily = this.config.fontFamily;
        }
        if (this.config.fontSize) {
            text.style.fontSize = `${this.config.fontSize}px`;
        }

        return text;
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
     * Update positions for all node elements
     */
    updateNodePositions(filteredNodes: Set<string> | null = null): void {
        this.nodeElements.forEach((elements, node) => {
            // Check if node should be visible
            const isVisible = !filteredNodes || filteredNodes.has(node.getId());
            elements.group.style.display = isVisible ? '' : 'none';

            if (!isVisible) return;

            // Update position
            const pos = node.position;
            elements.group.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
        });
    }

    /**
     * Update element visual state
     */
    updateElementState(elementId: string, state: VisualState, enabled: boolean): void {
        // Find the node element
        for (const [node, elements] of this.nodeElements) {
            if (node.getId() === elementId) {
                this.themeManager.setElementState(elementId, state, enabled);

                // Reapply styles
                const nodeType = node.getType() || 'default';
                this.applyNodeStyles(elements.shape, nodeType, elementId);
                break;
            }
        }
    }

    /**
     * Get node elements map (readonly)
     */
    getNodeElements(): ReadonlyMap<Node<T>, NodeElements> {
        return this.nodeElements;
    }

    /**
     * Measure text width using canvas context
     */
    measureTextWidth(text: string): number {
        if (!this.textContext) return text.length * 8; // Fallback estimation

        this.textContext.font = `${this.config.fontSize || 12}px ${this.config.fontFamily || 'Arial'}`;
        return this.textContext.measureText(text).width;
    }

    /**
     * Setup text measurement canvas
     * @private
     */
    private setupTextMeasurement(): void {
        this.textCanvas = document.createElement('canvas');
        this.textContext = this.textCanvas.getContext('2d');

        if (this.textContext) {
            this.textContext.font = `${this.config.fontSize || 12}px ${this.config.fontFamily || 'Arial'}`;
        }
    }

    /**
     * Clear all node elements
     */
    clearElements(): void {
        this.nodeElements.clear();
        if (this.nodeGroup) {
            this.nodeGroup.innerHTML = '';
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.clearElements();
        this.textCanvas = null;
        this.textContext = null;
        this.nodeGroup = null;
    }
}
