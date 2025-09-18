/**
 * RenderingCoordinator Tests
 *
 * Tests the rendering integration layer that extracts rendering coordination
 * responsibilities from the GraphNetwork God Object.
 */

import { RenderingCoordinator } from '../../../src/rendering/RenderingCoordinator';
import { SVGRenderer, RenderLink } from '../../../src/rendering/SVGRenderer';
import { Node } from '../../../src/Node';
import { Vector } from '../../../src/Vector';
import { ThemeManager } from '../../../src/theming/ThemeManager';
import { NodeData } from '../../../src/types/index';

// Mock SVGRenderer
jest.mock('../../../src/rendering/SVGRenderer');

// Mock getBBox for SVG text measurement
Object.defineProperty(SVGElement.prototype, 'getBBox', {
    value: jest.fn().mockReturnValue({
        width: 50,
        height: 20,
        x: 0,
        y: 0
    })
});

describe('RenderingCoordinator', () => {
    let coordinator: RenderingCoordinator<NodeData>;
    let container: HTMLElement;
    let themeManager: ThemeManager;
    let mockNodes: Map<string, Node<NodeData>>;
    let mockLinks: RenderLink<NodeData>[];
    let filteredNodes: Set<string>;

    beforeEach(() => {
        // Create container element
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);

        // Mock getBoundingClientRect
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

        // Create mock nodes
        const node1 = new Node<NodeData>(
            {
                id: 'node1',
                name: 'Node 1',
                type: 'default'
            },
            800,
            600
        );
        node1.position = new Vector(100, 100);

        const node2 = new Node<NodeData>(
            {
                id: 'node2',
                name: 'Node 2',
                type: 'default'
            },
            800,
            600
        );
        node2.position = new Vector(200, 200);

        mockNodes = new Map([
            ['node1', node1],
            ['node2', node2]
        ]);

        // Create mock links
        mockLinks = [{ source: node1, target: node2, label: 'Test Link' }];

        filteredNodes = new Set(['node1', 'node2']);

        // Create rendering coordinator
        coordinator = new RenderingCoordinator(container, 'test-container', themeManager);
    });

    afterEach(() => {
        coordinator.destroy();
        document.body.removeChild(container);
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should create RenderingCoordinator with default config', () => {
            expect(coordinator).toBeDefined();

            const state = coordinator.getRenderingState();
            expect(state.needsElementCreation).toBeTruthy();
            expect(state.needsRender).toBeTruthy();
        });

        test('should initialize underlying SVGRenderer', () => {
            coordinator.initialize();

            // Verify SVGRenderer methods were called
            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            expect(rendererInstance.initialize).toHaveBeenCalled();
        });

        test('should create coordinator using factory method', () => {
            const factoryCoordinator = RenderingCoordinator.create<NodeData>(
                container,
                'factory-test',
                themeManager
            );

            expect(factoryCoordinator).toBeDefined();
            factoryCoordinator.destroy();
        });
    });

    describe('Rendering State Management', () => {
        beforeEach(() => {
            coordinator.initialize();
        });

        test('should track rendering state correctly', () => {
            let state = coordinator.getRenderingState();
            expect(state.needsElementCreation).toBeTruthy();
            expect(state.needsRender).toBeTruthy();

            // After render, creation should be false but render might still be needed
            coordinator.render(mockNodes, mockLinks, filteredNodes);
            state = coordinator.getRenderingState();
            expect(state.needsElementCreation).toBeFalsy();
        });

        test('should request element creation', () => {
            coordinator.render(mockNodes, mockLinks, filteredNodes); // Clear initial state

            coordinator.requestElementCreation();

            const state = coordinator.getRenderingState();
            expect(state.needsElementCreation).toBeTruthy();
            expect(state.needsRender).toBeTruthy();
        });

        test('should request render', () => {
            coordinator.render(mockNodes, mockLinks, filteredNodes); // Clear initial state

            coordinator.requestRender();

            const state = coordinator.getRenderingState();
            expect(state.needsRender).toBeTruthy();
        });

        test('should request theme update', () => {
            coordinator.render(mockNodes, mockLinks, filteredNodes); // Clear initial state

            coordinator.requestThemeUpdate();

            const state = coordinator.getRenderingState();
            expect(state.needsThemeUpdate).toBeTruthy();
            expect(state.needsRender).toBeTruthy();
        });
    });

    describe('Rendering Operations', () => {
        beforeEach(() => {
            coordinator.initialize();
        });

        test('should execute render when needed', () => {
            const result = coordinator.render(mockNodes, mockLinks, filteredNodes);

            expect(result).toBeTruthy();

            // Verify SVGRenderer methods were called
            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            expect(rendererInstance.createElements).toHaveBeenCalledWith(mockNodes, mockLinks);
            expect(rendererInstance.render).toHaveBeenCalledWith(
                mockNodes,
                mockLinks,
                filteredNodes
            );
        });

        test('should skip render when not needed and not forced', () => {
            // Initial render to clear state
            coordinator.render(mockNodes, mockLinks, filteredNodes);

            // Immediate second render should be skipped
            const result = coordinator.render(mockNodes, mockLinks, filteredNodes);

            expect(result).toBeFalsy();
        });

        test('should force render when requested', () => {
            // Initial render to clear state
            coordinator.render(mockNodes, mockLinks, filteredNodes);

            // Force render should execute even if not needed
            const result = coordinator.render(mockNodes, mockLinks, filteredNodes, true);

            expect(result).toBeTruthy();
        });

        test('should handle empty nodes and links', () => {
            const emptyNodes = new Map<string, Node<NodeData>>();
            const emptyLinks: RenderLink<NodeData>[] = [];
            const emptyFiltered = new Set<string>();

            const result = coordinator.render(emptyNodes, emptyLinks, emptyFiltered);

            expect(result).toBeTruthy();
        });

        test('should apply theme updates during render', () => {
            coordinator.requestThemeUpdate();

            coordinator.render(mockNodes, mockLinks, filteredNodes);

            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            expect(rendererInstance.applyCanvasTheming).toHaveBeenCalled();
        });
    });

    describe('Transform Operations', () => {
        beforeEach(() => {
            coordinator.initialize();
        });

        test('should set transform', () => {
            coordinator.setTransform(10, 20, 1.5);

            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            expect(rendererInstance.setTransform).toHaveBeenCalledWith(10, 20, 1.5);
        });

        test('should get transform', () => {
            const mockTransform = { x: 10, y: 20, scale: 1.5 };
            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            (rendererInstance.getTransform as jest.Mock).mockReturnValue(mockTransform);

            const result = coordinator.getTransform();

            expect(result).toEqual(mockTransform);
            expect(rendererInstance.getTransform).toHaveBeenCalled();
        });
    });

    describe('Bounds and Element Access', () => {
        beforeEach(() => {
            coordinator.initialize();
        });

        test('should get bounds', () => {
            const mockBounds = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            (rendererInstance.getBounds as jest.Mock).mockReturnValue(mockBounds);

            const result = coordinator.getBounds(mockNodes, filteredNodes);

            expect(result).toEqual(mockBounds);
            expect(rendererInstance.getBounds).toHaveBeenCalledWith(mockNodes, filteredNodes);
        });

        test('should get SVG element', () => {
            const mockSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            (rendererInstance.getSVGElement as jest.Mock).mockReturnValue(mockSVG);

            const result = coordinator.getSVGElement();

            expect(result).toBe(mockSVG);
        });

        test('should get node elements', () => {
            const mockNodeElements = new Map();
            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            (rendererInstance.getNodeElements as jest.Mock).mockReturnValue(mockNodeElements);

            const result = coordinator.getNodeElements();

            expect(result).toBe(mockNodeElements);
        });

        test('should update element state', () => {
            coordinator.updateElementState('test-element', 'highlighted', true);

            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            expect(rendererInstance.updateElementState).toHaveBeenCalledWith(
                'test-element',
                'highlighted',
                true
            );
        });
    });

    describe('Resize Operations', () => {
        beforeEach(() => {
            coordinator.initialize();
        });

        test('should handle resize', () => {
            coordinator.resize(1000, 800);

            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            expect(rendererInstance.resize).toHaveBeenCalledWith(1000, 800);

            // Should request render after resize
            const state = coordinator.getRenderingState();
            expect(state.needsRender).toBeTruthy();
        });
    });

    describe('Metrics and Performance', () => {
        beforeEach(() => {
            coordinator.initialize();
        });

        test('should track rendering metrics', () => {
            // Initial metrics should be at defaults
            let metrics = coordinator.getRenderingMetrics();
            expect(metrics.renderCallCount).toBe(0);
            expect(metrics.skipFrameCount).toBe(0);

            // Render should update metrics
            coordinator.render(mockNodes, mockLinks, filteredNodes);
            metrics = coordinator.getRenderingMetrics();
            expect(metrics.renderCallCount).toBe(1);

            // Skip render should update skip count
            coordinator.render(mockNodes, mockLinks, filteredNodes);
            metrics = coordinator.getRenderingMetrics();
            expect(metrics.skipFrameCount).toBe(1);
        });

        test('should reset metrics', () => {
            // Create some metrics
            coordinator.render(mockNodes, mockLinks, filteredNodes);
            coordinator.render(mockNodes, mockLinks, filteredNodes); // Skip

            let metrics = coordinator.getRenderingMetrics();
            expect(metrics.renderCallCount).toBeGreaterThan(0);

            coordinator.resetMetrics();

            metrics = coordinator.getRenderingMetrics();
            expect(metrics.renderCallCount).toBe(0);
            expect(metrics.skipFrameCount).toBe(0);
        });

        test('should track average render time', () => {
            // Mock performance.now to control timing
            const originalNow = performance.now;
            let mockTime = 0;
            const mockNow = jest.fn(() => {
                const currentTime = mockTime;
                mockTime += 5; // Each call advances time by 5ms
                return currentTime;
            });
            performance.now = mockNow;

            // First render (time: 0 -> 5ms, duration: 5ms)
            coordinator.render(mockNodes, mockLinks, filteredNodes);

            // Force second render (time: 5 -> 10ms, duration: 5ms)
            coordinator.render(mockNodes, mockLinks, filteredNodes, true);

            const metrics = coordinator.getRenderingMetrics();
            expect(metrics.averageRenderTime).toBeGreaterThan(0);

            performance.now = originalNow;
        });
    });

    describe('Image Export', () => {
        beforeEach(() => {
            coordinator.initialize();
        });

        test('should export as SVG', async () => {
            const mockSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            (rendererInstance.getSVGElement as jest.Mock).mockReturnValue(mockSVG);

            const result = await coordinator.exportAsImage('svg');

            expect(typeof result).toBe('string');
            expect(result).toContain('svg');
        });

        test('should handle export when no SVG element', async () => {
            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            (rendererInstance.getSVGElement as jest.Mock).mockReturnValue(null);

            await expect(coordinator.exportAsImage('svg')).rejects.toThrow(
                'No SVG element available for export'
            );
        });
    });

    describe('Resource Management', () => {
        test('should clean up resources on destroy', () => {
            coordinator.initialize();

            coordinator.destroy();

            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            expect(rendererInstance.destroy).toHaveBeenCalled();
        });

        test('should handle multiple destroy calls gracefully', () => {
            expect(() => {
                coordinator.destroy();
                coordinator.destroy();
            }).not.toThrow();
        });
    });

    describe('Integration Scenarios', () => {
        beforeEach(() => {
            coordinator.initialize();
        });

        test('should handle full render cycle with multiple updates', () => {
            // Initial render
            let result = coordinator.render(mockNodes, mockLinks, filteredNodes);
            expect(result).toBeTruthy();

            // Request updates
            coordinator.requestElementCreation();
            coordinator.requestThemeUpdate();

            // Second render with updates
            result = coordinator.render(mockNodes, mockLinks, filteredNodes);
            expect(result).toBeTruthy();

            const rendererInstance = (SVGRenderer as jest.MockedClass<typeof SVGRenderer>).mock
                .instances[0];
            expect(rendererInstance.createElements).toHaveBeenCalledTimes(2);
            expect(rendererInstance.applyCanvasTheming).toHaveBeenCalledTimes(2);
        });

        test('should maintain consistent state through multiple operations', () => {
            // Perform various operations
            coordinator.render(mockNodes, mockLinks, filteredNodes);
            coordinator.setTransform(10, 20, 1.5);
            coordinator.resize(1000, 800);
            coordinator.updateElementState('test', 'active', true);
            coordinator.requestThemeUpdate();
            coordinator.render(mockNodes, mockLinks, filteredNodes);

            // Should maintain valid state
            const state = coordinator.getRenderingState();
            const metrics = coordinator.getRenderingMetrics();

            expect(state.lastRenderTime).toBeGreaterThan(0);
            expect(metrics.renderCallCount).toBe(2);
        });
    });
});
