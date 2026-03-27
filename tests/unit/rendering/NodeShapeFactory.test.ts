import {
    NodeShapeFactory,
    INodeShapeFactory,
    ShapeResult
} from '../../../src/rendering/NodeShapeFactory';
import { Node } from '../../../src/Node';
import { NodeData } from '../../../src/types/index';

describe('NodeShapeFactory', () => {
    let factory: NodeShapeFactory;

    beforeEach(() => {
        factory = new NodeShapeFactory();
    });

    describe('built-in shapes', () => {
        test('should support circle shape', () => {
            expect(factory.supportsShape('circle')).toBe(true);
        });

        test('should support rectangle shape', () => {
            expect(factory.supportsShape('rectangle')).toBe(true);
        });

        test('should support square shape', () => {
            expect(factory.supportsShape('square')).toBe(true);
        });

        test('should support triangle shape', () => {
            expect(factory.supportsShape('triangle')).toBe(true);
        });

        test('should create circle for default shape', () => {
            const node = new Node<NodeData>({ id: '1', name: 'Test' }, 800, 600);
            const result = factory.createShape(node);
            expect(result.shapeElement).toBeDefined();
            expect(result.shapeElement.tagName).toBe('circle');
        });

        test('should create rect for rectangle shape', () => {
            const node = new Node<NodeData>(
                { id: '1', name: 'Test', shape: 'rectangle' },
                800,
                600
            );
            const result = factory.createShape(node);
            expect(result.shapeElement).toBeDefined();
            expect(result.shapeElement.tagName).toBe('rect');
        });
    });

    describe('custom shape registration', () => {
        test('should register a custom shape by name', () => {
            const customCreator: INodeShapeFactory = {
                supportsShape: (shape: string) => shape === 'diamond',
                createShape: <T extends NodeData>(_node: Node<T>): ShapeResult => {
                    const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    el.setAttribute('points', '0,-10 10,0 0,10 -10,0');
                    return { shapeElement: el };
                }
            };

            factory.registerCreator(customCreator, 'diamond');
            expect(factory.supportsShape('diamond')).toBe(true);
        });

        test('should use custom creator for registered shape', () => {
            const customCreator: INodeShapeFactory = {
                supportsShape: (shape: string) => shape === 'star',
                createShape: <_T extends NodeData>(): ShapeResult => {
                    const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    el.setAttribute('data-custom', 'star');
                    return { shapeElement: el };
                }
            };

            factory.registerCreator(customCreator, 'star');
            const node = new Node<NodeData>({ id: '1', name: 'Star', shape: 'star' }, 800, 600);
            const result = factory.createShape(node);
            expect(result.shapeElement.getAttribute('data-custom')).toBe('star');
        });

        test('should fall back to default for unregistered shape', () => {
            const node = new Node<NodeData>({ id: '1', name: 'Test', shape: 'unknown' }, 800, 600);
            const result = factory.createShape(node);
            expect(result.shapeElement.tagName).toBe('circle'); // default fallback
        });

        test('should list all supported shapes', () => {
            const shapes = factory.getSupportedShapes();
            expect(shapes).toContain('circle');
            expect(shapes).toContain('rectangle');
            expect(shapes).toContain('square');
            expect(shapes).toContain('triangle');
        });
    });
});
