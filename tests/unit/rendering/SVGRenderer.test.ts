/**
 * SVGRenderer Tests
 *
 * Tests the critical DOM element creation and rendering functionality
 * that was identified as having very low test coverage (17.54%)
 */

import { SVGRenderer, RenderLink } from '../../../src/rendering/SVGRenderer';
import { Node } from '../../../src/Node';
import { Vector } from '../../../src/Vector';
import { ThemeManager } from '../../../src/theming/ThemeManager';
import { NodeData, LinkData } from '../../../src/types/index';

// Mock JSDOM environment
Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
        getPropertyValue: () => ''
    })
});

// Mock getBBox for SVG text measurement
Object.defineProperty(SVGElement.prototype, 'getBBox', {
    value: jest.fn().mockReturnValue({
        width: 50,
        height: 20,
        x: 0,
        y: 0
    })
});

describe('SVGRenderer', () => {
    let renderer: SVGRenderer;
    let container: HTMLElement;
    let themeManager: ThemeManager;
    let mockNode: Node<NodeData>;
    let mockNode2: Node<NodeData>;
    let mockLink: RenderLink<NodeData>;

    beforeEach(() => {
        // Create container element
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        document.body.appendChild(container);

        // Mock getBoundingClientRect to return consistent dimensions
        Object.defineProperty(container, 'getBoundingClientRect', {
            value: jest.fn().mockReturnValue({
                width: 800,
                height: 600,
                top: 0,
                left: 0,
                right: 800,
                bottom: 600,
                x: 0,
                y: 0
            })
        });

        // Create theme manager
        themeManager = new ThemeManager();

        // Create renderer
        renderer = new SVGRenderer(container, 'test-container', themeManager);

        // Create mock nodes
        mockNode = new Node<NodeData>(
            {
                id: 'node1',
                name: 'Test Node 1',
                type: 'default',
                shape: 'circle'
            },
            800,
            600
        );
        mockNode.position = new Vector(100, 100);

        mockNode2 = new Node<NodeData>(
            {
                id: 'node2',
                name: 'Test Node 2',
                type: 'secondary',
                shape: 'rectangle'
            },
            800,
            600
        );
        mockNode2.position = new Vector(200, 200);

        // Create mock link
        mockLink = {
            source: mockNode,
            target: mockNode2,
            label: 'Test Link'
        };
    });

    afterEach(() => {
        if (renderer) {
            renderer.destroy();
        }
        document.body.removeChild(container);
    });

    describe('Initialization', () => {
        test('should initialize with container', () => {
            renderer.initialize();

            expect(renderer.getSVGElement()).toBeInstanceOf(SVGSVGElement);
        });

        test('should create proper SVG structure', () => {
            renderer.initialize();

            const svg = renderer.getSVGElement();
            expect(svg).not.toBeNull();
            expect(svg!.tagName).toBe('svg');
            expect(svg!.getAttribute('width')).toBe('800');
            expect(svg!.getAttribute('height')).toBe('600');

            // Check for required groups
            const defs = svg!.querySelector('defs');
            expect(defs).not.toBeNull();

            const transformGroup = svg!.querySelector('g[class*="transform"]');
            expect(transformGroup).not.toBeNull();
        });

        test('should handle container resize', () => {
            renderer.initialize();

            // Trigger resize
            renderer.resize(1000, 800);

            const svg = renderer.getSVGElement();
            expect(svg).not.toBeNull();
            // SVG should update dimensions
            expect(svg!.getAttribute('width')).toBe('1000');
            expect(svg!.getAttribute('height')).toBe('800');
        });
    });

    describe('Node Element Creation', () => {
        beforeEach(() => {
            renderer.initialize();
        });

        test('should create circle node elements', () => {
            const nodes = new Map([['node1', mockNode]]);
            const links: RenderLink<NodeData>[] = [];

            renderer.createElements(nodes, links);
            renderer.render(nodes, links);

            const svg = renderer.getSVGElement();
            const nodeGroup = svg!.querySelector('g[data-id="node1"]');
            expect(nodeGroup).not.toBeNull();

            const circle = nodeGroup!.querySelector('circle');
            expect(circle).not.toBeNull();
            expect(circle!.getAttribute('r')).toBeTruthy();

            const text = nodeGroup!.querySelector('text');
            expect(text).not.toBeNull();
            expect(text!.textContent).toBe('Test Node 1');
        });

        test('should create rectangle node elements', () => {
            const nodes = new Map([['node2', mockNode2]]);
            const links: RenderLink<NodeData>[] = [];

            renderer.createElements(nodes, links);
            renderer.render(nodes, links);

            const svg = renderer.getSVGElement();
            const nodeGroup = svg!.querySelector('g[data-id="node2"]');
            expect(nodeGroup).not.toBeNull();

            const rect = nodeGroup!.querySelector('rect');
            expect(rect).not.toBeNull();
            expect(rect!.getAttribute('width')).toBeTruthy();
            expect(rect!.getAttribute('height')).toBeTruthy();

            const text = nodeGroup!.querySelector('text');
            expect(text).not.toBeNull();
            expect(text!.textContent).toBe('Test Node 2');
        });

        test('should create square node elements', () => {
            const squareNode = new Node<NodeData>(
                {
                    id: 'node3',
                    name: 'Square Node',
                    shape: 'square'
                },
                800,
                600
            );

            const nodes = new Map([['node3', squareNode]]);
            const links: RenderLink<NodeData>[] = [];

            renderer.createElements(nodes, links);
            renderer.render(nodes, links);

            const svg = renderer.getSVGElement();
            const nodeGroup = svg!.querySelector('g[data-id="node3"]');
            expect(nodeGroup).not.toBeNull();

            const rect = nodeGroup!.querySelector('rect');
            expect(rect).not.toBeNull();

            // Square should have equal width and height
            const width = rect!.getAttribute('width');
            const height = rect!.getAttribute('height');
            expect(width).toBe(height);
        });

        test('should create triangle node elements', () => {
            const triangleNode = new Node<NodeData>(
                {
                    id: 'node4',
                    name: 'Triangle Node',
                    shape: 'triangle'
                },
                800,
                600
            );
            triangleNode.position = new Vector(150, 150);

            const nodes = new Map([['node4', triangleNode]]);
            const links: RenderLink<NodeData>[] = [];

            renderer.createElements(nodes, links);
            renderer.render(nodes, links);

            const svg = renderer.getSVGElement();
            const nodeGroup = svg!.querySelector('g[data-id="node4"]');
            expect(nodeGroup).not.toBeNull();

            const polygon = nodeGroup!.querySelector('polygon');
            expect(polygon).not.toBeNull();
            expect(polygon!.getAttribute('points')).toBeTruthy();
        });

        test('should handle nodes with dynamic sizing', () => {
            // Change to rectangle shape to use dynamic sizing
            mockNode.data.shape = 'rectangle';

            const nodes = new Map([['node1', mockNode]]);
            const links: RenderLink<NodeData>[] = [];

            renderer.createElements(nodes, links);
            renderer.render(nodes, links);

            const svg = renderer.getSVGElement();
            const nodeGroup = svg!.querySelector('g[data-id="node1"]');
            const rect = nodeGroup!.querySelector('rect');

            // Dynamic sizing should be calculated based on text width + padding
            const width = parseFloat(rect!.getAttribute('width')!);
            const height = parseFloat(rect!.getAttribute('height')!);
            expect(width).toBeGreaterThan(40); // Min width based on size * 2
            expect(height).toBeGreaterThan(25); // Height based on size * 1.4

            // Check that dynamic dimensions were set on node
            expect(mockNode.dynamicWidth).toBeDefined();
            expect(mockNode.dynamicHeight).toBeDefined();
        });

        test('should apply theme styles to nodes', () => {
            const nodes = new Map([['node1', mockNode]]);
            const links: RenderLink<NodeData>[] = [];

            renderer.createElements(nodes, links);
            renderer.render(nodes, links);

            const svg = renderer.getSVGElement();
            const nodeGroup = svg!.querySelector('g[data-id="node1"]');
            const circle = nodeGroup!.querySelector('circle');

            // Should have theme-applied styles
            expect(circle!.getAttribute('fill')).toBeTruthy();
            expect(circle!.getAttribute('stroke')).toBeTruthy();
        });
    });

    describe('Link Element Creation', () => {
        beforeEach(() => {
            renderer.initialize();
        });

        test('should create link elements between nodes', () => {
            const nodes = new Map([
                ['node1', mockNode],
                ['node2', mockNode2]
            ]);
            const links = [mockLink];

            renderer.createElements(nodes, links);
            renderer.render(nodes, links);

            const svg = renderer.getSVGElement();
            const linkElement = svg!.querySelector('line');
            expect(linkElement).not.toBeNull();

            // Should have proper coordinates
            expect(linkElement!.getAttribute('x1')).toBeTruthy();
            expect(linkElement!.getAttribute('y1')).toBeTruthy();
            expect(linkElement!.getAttribute('x2')).toBeTruthy();
            expect(linkElement!.getAttribute('y2')).toBeTruthy();
        });

        test('should create link labels', () => {
            mockLink.label = 'Connection Label';

            const nodes = new Map([
                ['node1', mockNode],
                ['node2', mockNode2]
            ]);
            const links = [mockLink];

            renderer.createElements(nodes, links);
            renderer.render(nodes, links);

            const svg = renderer.getSVGElement();
            const linkText = svg!.querySelector('text');

            // Should find link label text
            const linkLabels = Array.from(svg!.querySelectorAll('text')).filter(
                text => text.textContent === 'Connection Label'
            );
            expect(linkLabels.length).toBeGreaterThan(0);
        });

        test('should handle curved links', () => {
            // Create self-referencing link (should be curved)
            const selfLink: RenderLink<NodeData> = {
                source: mockNode,
                target: mockNode,
                label: 'Self Link'
            };

            const nodes = new Map([['node1', mockNode]]);
            const links = [selfLink];

            renderer.render(nodes, links);

            const svg = renderer.getSVGElement();
            // Self-links should create path elements instead of lines
            const pathElement = svg!.querySelector('path');
            expect(pathElement).not.toBeNull();
        });
    });

    describe('Position Updates', () => {
        beforeEach(() => {
            renderer.initialize();
        });

        test('should update node positions', () => {
            const nodes = new Map([['node1', mockNode]]);
            const links: RenderLink<NodeData>[] = [];

            // Initial render
            renderer.createElements(nodes, links);
            renderer.render(nodes, links);

            // Update node position
            mockNode.position = new Vector(300, 400);

            // Re-render
            renderer.render(nodes, links);

            const svg = renderer.getSVGElement();
            const nodeGroup = svg!.querySelector('g[data-id="node1"]');
            const transform = nodeGroup!.getAttribute('transform');

            expect(transform).toContain('300');
            expect(transform).toContain('400');
        });

        test('should update link positions when nodes move', () => {
            const nodes = new Map([
                ['node1', mockNode],
                ['node2', mockNode2]
            ]);
            const links = [mockLink];

            // Initial render
            renderer.createElements(nodes, links);
            renderer.render(nodes, links);

            // Move nodes
            mockNode.position = new Vector(50, 50);
            mockNode2.position = new Vector(350, 350);

            // Re-render
            renderer.render(nodes, links);

            const svg = renderer.getSVGElement();
            const linkElement = svg!.querySelector('line');

            const x1 = parseFloat(linkElement!.getAttribute('x1')!);
            const y1 = parseFloat(linkElement!.getAttribute('y1')!);
            const x2 = parseFloat(linkElement!.getAttribute('x2')!);
            const y2 = parseFloat(linkElement!.getAttribute('y2')!);

            // Link coordinates should be updated
            expect(Math.abs(x1 - 50)).toBeLessThan(30); // Allow for node radius
            expect(Math.abs(y1 - 50)).toBeLessThan(30);
            expect(Math.abs(x2 - 350)).toBeLessThan(30);
            expect(Math.abs(y2 - 350)).toBeLessThan(30);
        });
    });

    describe('Transform Operations', () => {
        beforeEach(() => {
            renderer.initialize();
        });

        test('should apply transform updates', () => {
            const nodes = new Map([['node1', mockNode]]);
            const links: RenderLink<NodeData>[] = [];

            renderer.createElements(nodes, links);
            renderer.setTransform(10, 20, 1.5);
            renderer.render(nodes, links);

            const svg = renderer.getSVGElement();
            const transformGroup = svg!.querySelector('g');
            const style = transformGroup!.style.transform;

            expect(style).toContain('translate(10px, 20px)');
            expect(style).toContain('scale(1.5)');
        });

        test('should handle background grid transform sync', () => {
            renderer.setTransform(15, 25, 2.0);

            const transform = renderer.getTransform();
            expect(transform.x).toBe(15);
            expect(transform.y).toBe(25);
            expect(transform.scale).toBe(2.0);
        });
    });

    describe('Filtering and Visibility', () => {
        beforeEach(() => {
            renderer.initialize();
        });

        test('should hide filtered nodes', () => {
            const nodes = new Map([
                ['node1', mockNode],
                ['node2', mockNode2]
            ]);
            const links = [mockLink];

            // Render with node2 filtered out
            const filteredNodes = new Set(['node1']);

            renderer.createElements(nodes, links);
            renderer.render(nodes, links, filteredNodes);

            const svg = renderer.getSVGElement();
            const node1Group = svg!.querySelector('g[data-id="node1"]');
            const node2Group = svg!.querySelector('g[data-id="node2"]');

            expect(node1Group!.style.opacity).toBe('1');
            expect(node2Group!.style.opacity).toBe('0.1');
        });

        test('should hide links to filtered nodes', () => {
            const nodes = new Map([
                ['node1', mockNode],
                ['node2', mockNode2]
            ]);
            const links = [mockLink];

            // Filter out target node
            const filteredNodes = new Set(['node1']);

            renderer.createElements(nodes, links);
            renderer.render(nodes, links, filteredNodes);

            const svg = renderer.getSVGElement();
            const linkElement = svg!.querySelector('line');

            // Link should be semi-transparent since target is filtered
            expect(linkElement!.style.opacity).toBe('0.1');
        });
    });

    describe('Cleanup and Destruction', () => {
        test('should clean up DOM elements on destroy', () => {
            renderer.initialize();

            const nodes = new Map([['node1', mockNode]]);
            renderer.render(nodes, []);

            // Verify elements exist
            expect(container.children.length).toBeGreaterThan(0);

            renderer.destroy();

            // Container should be cleared
            expect(container.children.length).toBe(0);
        });

        test('should clear all element references', () => {
            renderer.initialize();
            renderer.destroy();

            expect(renderer.getSVGElement()).toBeNull();
        });
    });

    describe('Error Handling', () => {
        test('should handle missing container gracefully', () => {
            expect(() => {
                renderer.render(new Map(), []);
            }).not.toThrow();
        });

        test('should handle invalid node data', () => {
            renderer.initialize();

            const invalidNode = new Node<NodeData>(
                {
                    id: '',
                    name: '',
                    shape: 'invalid' as any
                },
                800,
                600
            );

            const nodes = new Map([['invalid', invalidNode]]);

            expect(() => {
                renderer.render(nodes, []);
            }).not.toThrow();
        });

        test('should handle broken link references', () => {
            renderer.initialize();

            const brokenLink: RenderLink<NodeData> = {
                source: mockNode,
                target: mockNode2 // node2 not in nodes map
            };

            const nodes = new Map([['node1', mockNode]]);
            const links = [brokenLink];

            expect(() => {
                renderer.render(nodes, links);
            }).not.toThrow();
        });
    });
});
