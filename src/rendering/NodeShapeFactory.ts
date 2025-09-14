/**
 * NodeShapeFactory - Factory pattern for creating SVG node shapes
 *
 * Reduces cyclomatic complexity by extracting shape creation logic
 * from the monolithic createNodeShape() method.
 */

import { Node } from '../Node';
import { NodeData } from '../types/index';

export interface ShapeResult {
    shapeElement: SVGElement;
    hiddenIndicator?: SVGElement;
}

export interface INodeShapeFactory {
    createShape<T extends NodeData>(node: Node<T>): ShapeResult;
    supportsShape(shape: string): boolean;
}

/**
 * Base abstract class for shape creators
 */
abstract class BaseShapeCreator implements INodeShapeFactory {
    abstract createShape<T extends NodeData>(node: Node<T>): ShapeResult;
    abstract supportsShape(shape: string): boolean;

    protected createSVGElement(tagName: string): SVGElement {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName);
    }

    protected applyCommonAttributes<T extends NodeData>(element: SVGElement, node: Node<T>): void {
        element.classList.add('node', 'node-shape');
        element.setAttribute('data-id', node.getId());

        const nodeType = node.getType();
        if (nodeType) {
            element.classList.add(`node-${nodeType}`);
            element.setAttribute('data-type', nodeType);
        }
    }
}

/**
 * Circle shape creator
 */
class CircleShapeCreator extends BaseShapeCreator {
    supportsShape(shape: string): boolean {
        return shape === 'circle';
    }

    createShape<T extends NodeData>(node: Node<T>): ShapeResult {
        const shapeElement = this.createSVGElement('circle');
        shapeElement.setAttribute('r', node.size.toString());

        this.applyCommonAttributes(shapeElement, node);

        return { shapeElement };
    }
}

/**
 * Rectangle shape creator
 */
class RectangleShapeCreator extends BaseShapeCreator {
    supportsShape(shape: string): boolean {
        return shape === 'rectangle';
    }

    createShape<T extends NodeData>(node: Node<T>): ShapeResult {
        const dimensions = this.calculateRectangleDimensions(node);
        const shapeElement = this.createRectangleElement(dimensions);
        const hiddenIndicator = this.createHiddenIndicator(dimensions);

        // Store dynamic dimensions on node for physics calculations
        node.dynamicWidth = dimensions.width;
        node.dynamicHeight = dimensions.height;

        this.applyCommonAttributes(shapeElement, node);

        return { shapeElement, hiddenIndicator };
    }

    private calculateRectangleDimensions<T extends NodeData>(node: Node<T>): RectangleDimensions {
        const textWidth = this.measureTextWidth(node.getName());
        const padding = 20;
        const minWidth = node.size * 2;
        const width = Math.max(minWidth, textWidth + padding);
        const height = node.size * 1.4;

        return { width, height };
    }

    private createRectangleElement(dimensions: RectangleDimensions): SVGElement {
        const rect = this.createSVGElement('rect');
        rect.setAttribute('x', (-dimensions.width / 2).toString());
        rect.setAttribute('y', (-dimensions.height / 2).toString());
        rect.setAttribute('width', dimensions.width.toString());
        rect.setAttribute('height', dimensions.height.toString());
        rect.setAttribute('rx', '5');

        return rect;
    }

    private createHiddenIndicator(dimensions: RectangleDimensions): SVGElement {
        const indicatorPadding = 4;
        const indicator = this.createSVGElement('rect');

        indicator.setAttribute('x', (-(dimensions.width + indicatorPadding) / 2).toString());
        indicator.setAttribute('y', (-(dimensions.height + indicatorPadding) / 2).toString());
        indicator.setAttribute('width', (dimensions.width + indicatorPadding).toString());
        indicator.setAttribute('height', (dimensions.height + indicatorPadding).toString());
        indicator.setAttribute('rx', '5');
        indicator.classList.add('hidden-connection-indicator');
        indicator.style.display = 'none';

        return indicator;
    }

    private measureTextWidth(text: string): number {
        // Create temporary text element to measure width
        const tempText = this.createSVGElement('text');
        tempText.textContent = text;
        tempText.style.visibility = 'hidden';
        tempText.style.position = 'absolute';

        // Append to document to get measurements
        document.body.appendChild(tempText);
        const bbox = (tempText as SVGTextElement).getBBox();
        const width = bbox.width;
        document.body.removeChild(tempText);

        return width || text.length * 8; // Fallback estimate
    }
}

/**
 * Square shape creator
 */
class SquareShapeCreator extends BaseShapeCreator {
    supportsShape(shape: string): boolean {
        return shape === 'square';
    }

    createShape<T extends NodeData>(node: Node<T>): ShapeResult {
        const squareSize = node.size * 1.4;
        const shapeElement = this.createSVGElement('rect');

        shapeElement.setAttribute('x', (-squareSize / 2).toString());
        shapeElement.setAttribute('y', (-squareSize / 2).toString());
        shapeElement.setAttribute('width', squareSize.toString());
        shapeElement.setAttribute('height', squareSize.toString());
        shapeElement.setAttribute('rx', '5');

        this.applyCommonAttributes(shapeElement, node);

        return { shapeElement };
    }
}

/**
 * Triangle shape creator
 */
class TriangleShapeCreator extends BaseShapeCreator {
    supportsShape(shape: string): boolean {
        return shape === 'triangle';
    }

    createShape<T extends NodeData>(node: Node<T>): ShapeResult {
        const triangleSize = node.size * 1.4;
        const height = (triangleSize * Math.sqrt(3)) / 2;

        const points = this.calculateTrianglePoints(triangleSize, height);
        const shapeElement = this.createSVGElement('polygon');
        shapeElement.setAttribute('points', points);

        this.applyCommonAttributes(shapeElement, node);

        return { shapeElement };
    }

    private calculateTrianglePoints(size: number, height: number): string {
        const points = [
            [0, -height / 2],
            [-size / 2, height / 2],
            [size / 2, height / 2]
        ];

        return points.map(point => point.join(',')).join(' ');
    }
}

/**
 * Main factory class that manages all shape creators
 */
export class NodeShapeFactory {
    private creators = new Map<string, INodeShapeFactory>();
    private defaultCreator: INodeShapeFactory;

    constructor() {
        // Register shape creators
        this.registerCreator(new CircleShapeCreator());
        this.registerCreator(new RectangleShapeCreator());
        this.registerCreator(new SquareShapeCreator());
        this.registerCreator(new TriangleShapeCreator());

        // Set default creator
        this.defaultCreator = new CircleShapeCreator();
    }

    /**
     * Create a shape for the given node
     */
    createShape<T extends NodeData>(node: Node<T>): ShapeResult {
        const shape = node.getShape();
        const creator = this.creators.get(shape) || this.defaultCreator;

        return creator.createShape(node);
    }

    /**
     * Register a new shape creator
     */
    registerCreator(creator: INodeShapeFactory): void {
        // Find which shapes this creator supports
        const supportedShapes = ['circle', 'rectangle', 'square', 'triangle'];

        for (const shape of supportedShapes) {
            if (creator.supportsShape(shape)) {
                this.creators.set(shape, creator);
            }
        }
    }

    /**
     * Check if a shape is supported
     */
    supportsShape(shape: string): boolean {
        return this.creators.has(shape) || shape === 'circle'; // circle is default
    }

    /**
     * Get list of supported shapes
     */
    getSupportedShapes(): string[] {
        return Array.from(this.creators.keys());
    }

    /**
     * Set default creator for unsupported shapes
     */
    setDefaultCreator(creator: INodeShapeFactory): void {
        this.defaultCreator = creator;
    }
}

// Helper interfaces
interface RectangleDimensions {
    width: number;
    height: number;
}

// Export commonly used creators for testing
export { CircleShapeCreator, RectangleShapeCreator, SquareShapeCreator, TriangleShapeCreator };
