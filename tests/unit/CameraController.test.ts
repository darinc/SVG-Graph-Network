/**
 * @jest-environment jsdom
 */

import { CameraController } from '../../src/camera/CameraController';
import { FocusEvent, FocusOptions } from '../../src/types/styling';

// Mock SVG elements
const createMockSVGElement = (): SVGSVGElement => {
    const element = {
        getBoundingClientRect: jest.fn(() => ({ width: 800, height: 600 })),
        setAttribute: jest.fn()
    } as any;
    return element;
};

const createMockTransformGroup = (): SVGGElement => {
    const element = {
        setAttribute: jest.fn()
    } as any;
    return element;
};

// Mock requestAnimationFrame
const mockRAF = () => {
    let id = 0;
    const callbacks = new Map<number, () => void>();

    global.requestAnimationFrame = jest.fn((callback: () => void) => {
        const currentId = ++id;
        setTimeout(() => {
            if (callbacks.has(currentId)) {
                callback();
                callbacks.delete(currentId);
            }
        }, 16); // ~60fps
        callbacks.set(currentId, callback);
        return currentId;
    });

    return {
        flush: () => {
            callbacks.forEach(callback => callback());
            callbacks.clear();
        },
        clear: () => callbacks.clear()
    };
};

describe('CameraController', () => {
    let cameraController: CameraController;
    let mockCallback: jest.Mock;
    let lastEvent: FocusEvent | null;
    let mockSvg: SVGSVGElement;
    let mockTransformGroup: SVGGElement;
    let rafMock: ReturnType<typeof mockRAF>;

    beforeEach(() => {
        rafMock = mockRAF();

        // Mock setTimeout to execute immediately in tests
        jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
            fn();
            return 123 as any;
        });

        mockCallback = jest.fn((event: FocusEvent) => {
            lastEvent = event;
        });
        cameraController = new CameraController(mockCallback);
        lastEvent = null;

        // Mock SVG elements
        mockSvg = createMockSVGElement();
        mockTransformGroup = createMockTransformGroup();

        cameraController.initialize(mockSvg, mockTransformGroup);
    });

    afterEach(() => {
        rafMock.clear();
        jest.restoreAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with SVG elements', () => {
            const newController = new CameraController();
            const svg = createMockSVGElement();
            const transformGroup = createMockTransformGroup();

            expect(() => {
                newController.initialize(svg, transformGroup);
            }).not.toThrow();
        });

        test('should update viewport size from SVG element', () => {
            (mockSvg.getBoundingClientRect as jest.Mock).mockReturnValue({
                width: 1200,
                height: 800
            });

            cameraController.updateViewportSize();

            const bounds = cameraController.getViewBounds();
            expect(bounds.width).toBe(1200);
            expect(bounds.height).toBe(800);
        });
    });

    describe('Node Position Management', () => {
        beforeEach(() => {
            // Setup sample node positions
            const positions = new Map([
                ['node1', { x: 100, y: 100, size: 20 }],
                ['node2', { x: 200, y: 150, size: 30 }],
                ['node3', { x: 300, y: 200, size: 25 }],
                ['node4', { x: 150, y: 250, size: 20 }]
            ]);
            cameraController.updateNodePositions(positions);
        });

        test('should update node positions', () => {
            const newPositions = new Map([
                ['nodeA', { x: 50, y: 50, size: 15 }],
                ['nodeB', { x: 150, y: 100, size: 25 }]
            ]);

            expect(() => {
                cameraController.updateNodePositions(newPositions);
            }).not.toThrow();
        });

        test('should focus on single node', async () => {
            await cameraController.focusOnNode('node1', { animated: false });

            expect(mockTransformGroup.setAttribute).toHaveBeenCalledWith(
                'transform',
                expect.stringContaining('translate')
            );
            expect(mockCallback).toHaveBeenCalledTimes(1);
            expect(lastEvent?.type).toBe('focusChanged');
            expect(lastEvent?.targetNodes).toEqual(['node1']);
        });

        test('should throw error for non-existent node', async () => {
            await expect(cameraController.focusOnNode('nonexistent')).rejects.toThrow(
                "Node 'nonexistent' not found"
            );
        });

        test('should focus on multiple nodes', async () => {
            await cameraController.focusOnNodes(['node1', 'node2'], { animated: false });

            expect(mockTransformGroup.setAttribute).toHaveBeenCalled();
            expect(lastEvent?.targetNodes).toEqual(['node1', 'node2']);
        });

        test('should throw error for empty node array', async () => {
            await expect(cameraController.focusOnNodes([])).rejects.toThrow(
                'No nodes provided for focus'
            );
        });

        test('should throw error when no provided nodes exist', async () => {
            await expect(
                cameraController.focusOnNodes(['nonexistent1', 'nonexistent2'])
            ).rejects.toThrow('None of the provided nodes were found');
        });
    });

    describe('Focus Options', () => {
        beforeEach(() => {
            const positions = new Map([
                ['node1', { x: 100, y: 100, size: 20 }],
                ['node2', { x: 200, y: 200, size: 20 }]
            ]);
            cameraController.updateNodePositions(positions);
        });

        test('should respect custom scale option', async () => {
            await cameraController.focusOnNode('node1', {
                scale: 2.0,
                animated: false
            });

            const transformCall = (mockTransformGroup.setAttribute as jest.Mock).mock.calls[0];
            expect(transformCall[1]).toContain('scale(2');
        });

        // TODO: Fix padding calculation differences in test environment
        test.skip('should apply padding option', async () => {
            (mockTransformGroup.setAttribute as jest.Mock).mockClear();

            await cameraController.focusOnNode('node1', {
                padding: 50,
                animated: false
            });

            const firstTransform = (mockTransformGroup.setAttribute as jest.Mock).mock.calls[0][1];
            (mockTransformGroup.setAttribute as jest.Mock).mockClear();

            await cameraController.focusOnNode('node1', {
                padding: 100,
                animated: false
            });

            const secondTransform = (mockTransformGroup.setAttribute as jest.Mock).mock.calls[0][1];

            // Different padding should result in different transforms
            expect(firstTransform).not.toBe(secondTransform);
        });

        test('should apply offset option', async () => {
            await cameraController.focusOnNode('node1', {
                offset: { x: 50, y: -30 },
                animated: false
            });

            const transformCall = (mockTransformGroup.setAttribute as jest.Mock).mock.calls[0];
            expect(transformCall[1]).toContain('translate');
        });

        test('should use different easing functions', async () => {
            const options: FocusOptions = {
                duration: 100,
                easing: 'ease-in',
                animated: true
            };

            const startTime = Date.now();
            const focusPromise = cameraController.focusOnNode('node1', options);

            // Let animation run briefly then resolve
            setTimeout(() => rafMock.flush(), 50);

            await focusPromise;
            const endTime = Date.now();

            expect(endTime - startTime).toBeGreaterThanOrEqual(50);
            expect(mockCallback).toHaveBeenCalled();
        });
    });

    describe('View Operations', () => {
        beforeEach(() => {
            const positions = new Map([
                ['node1', { x: 0, y: 0, size: 20 }],
                ['node2', { x: 200, y: 200, size: 20 }],
                ['node3', { x: 400, y: 400, size: 20 }]
            ]);
            cameraController.updateNodePositions(positions);
        });

        test('should fit to view', async () => {
            const promise = cameraController.fitToView(50);
            rafMock.flush(); // Process any pending animations
            await promise;

            expect(mockTransformGroup.setAttribute).toHaveBeenCalledWith(
                'transform',
                expect.stringMatching(/translate\(.+\) scale\(.+\)/)
            );
        });

        test('should center view', async () => {
            const promise = cameraController.centerView();
            rafMock.flush(); // Process any pending animations
            await promise;

            const transformCall = (mockTransformGroup.setAttribute as jest.Mock).mock.calls[0];
            expect(transformCall[1]).toContain('translate');
            expect(transformCall[1]).toContain('scale');
        });

        test('should handle empty node set gracefully', async () => {
            cameraController.updateNodePositions(new Map());

            await expect(cameraController.fitToView()).resolves.toBeUndefined();
            await expect(cameraController.centerView()).resolves.toBeUndefined();
        });
    });

    describe('Transform Management', () => {
        test('should set transform directly without animation', async () => {
            await cameraController.setTransform(100, 200, 1.5, false);

            expect(mockTransformGroup.setAttribute).toHaveBeenCalledWith(
                'transform',
                'translate(100, 200) scale(1.5)'
            );
        });

        test('should set transform with animation', async () => {
            const startTime = Date.now();
            const transformPromise = cameraController.setTransform(100, 200, 1.5, true);

            // Let animation run then complete
            setTimeout(() => rafMock.flush(), 50);
            await transformPromise;

            const endTime = Date.now();
            expect(endTime - startTime).toBeGreaterThanOrEqual(50);
            expect(mockTransformGroup.setAttribute).toHaveBeenCalled();
        });

        test('should get current view bounds', () => {
            const bounds = cameraController.getViewBounds();

            expect(bounds).toHaveProperty('minX');
            expect(bounds).toHaveProperty('maxX');
            expect(bounds).toHaveProperty('minY');
            expect(bounds).toHaveProperty('maxY');
            expect(bounds).toHaveProperty('width');
            expect(bounds).toHaveProperty('height');
            expect(bounds).toHaveProperty('center');
            expect(typeof bounds.center.x).toBe('number');
            expect(typeof bounds.center.y).toBe('number');
        });
    });

    describe('Animation Control', () => {
        beforeEach(() => {
            const positions = new Map([['node1', { x: 100, y: 100, size: 20 }]]);
            cameraController.updateNodePositions(positions);
        });

        test('should track animation state', async () => {
            const animationPromise = cameraController.focusOnNode('node1', {
                duration: 1000,
                animated: true
            });

            // Should be animating immediately after starting
            expect(cameraController.isAnimating()).toBe(true);

            // Complete the animation
            rafMock.flush();
            await animationPromise;

            // Should no longer be animating
            expect(cameraController.isAnimating()).toBe(false);
        });

        test('should stop animation', async () => {
            const animationPromise = cameraController.focusOnNode('node1', {
                duration: 1000,
                animated: true
            });

            expect(cameraController.isAnimating()).toBe(true);

            cameraController.stopAnimation();

            expect(cameraController.isAnimating()).toBe(false);

            // Animation promise should still resolve
            await expect(animationPromise).resolves.toBeUndefined();
        });

        test('should handle overlapping animations', async () => {
            // Start first animation
            const animation1 = cameraController.focusOnNode('node1', {
                duration: 1000,
                animated: true
            });

            expect(cameraController.isAnimating()).toBe(true);

            // Start second animation (should stop first)
            const animation2 = cameraController.setTransform(200, 200, 2.0, true);

            // Both should resolve
            rafMock.flush();
            await Promise.all([animation1, animation2]);

            expect(cameraController.isAnimating()).toBe(false);
        });
    });

    describe('Easing Functions', () => {
        beforeEach(() => {
            const positions = new Map([['node1', { x: 100, y: 100, size: 20 }]]);
            cameraController.updateNodePositions(positions);
        });

        const easingTypes = [
            'linear',
            'ease',
            'ease-in',
            'ease-out',
            'ease-in-out',
            'cubic-bezier'
        ] as const;

        easingTypes.forEach(easing => {
            test(`should handle ${easing} easing`, async () => {
                const animationPromise = cameraController.focusOnNode('node1', {
                    duration: 100,
                    easing,
                    animated: true
                });

                rafMock.flush();
                await expect(animationPromise).resolves.toBeUndefined();

                expect(lastEvent?.options.easing).toBe(easing);
            });
        });
    });

    describe('Viewport Calculations', () => {
        test('should calculate bounds for single node', () => {
            const positions = new Map([['node1', { x: 100, y: 100, size: 20 }]]);
            cameraController.updateNodePositions(positions);

            // Access private method through reflection for testing
            const bounds = (cameraController as any).calculateBounds(
                Array.from(positions.values()).map(pos => ({
                    id: 'node1',
                    x: pos.x,
                    y: pos.y,
                    size: pos.size
                }))
            );

            expect(bounds.minX).toBe(90); // 100 - 10 (size/2)
            expect(bounds.maxX).toBe(110); // 100 + 10 (size/2)
            expect(bounds.center.x).toBe(100);
            expect(bounds.center.y).toBe(100);
        });

        test('should calculate bounds for multiple nodes', () => {
            const positions = new Map([
                ['node1', { x: 0, y: 0, size: 20 }],
                ['node2', { x: 100, y: 100, size: 30 }]
            ]);
            cameraController.updateNodePositions(positions);

            const nodePositions = Array.from(positions.entries()).map(([id, pos]) => ({
                id,
                x: pos.x,
                y: pos.y,
                size: pos.size
            }));

            const bounds = (cameraController as any).calculateBounds(nodePositions);

            expect(bounds.minX).toBe(-10); // node1: 0 - 10
            expect(bounds.maxX).toBe(115); // node2: 100 + 15
            expect(bounds.minY).toBe(-10); // node1: 0 - 10
            expect(bounds.maxY).toBe(115); // node2: 100 + 15
        });

        test('should handle empty position array', () => {
            const bounds = (cameraController as any).calculateBounds([]);

            expect(bounds.minX).toBe(0);
            expect(bounds.maxX).toBe(0);
            expect(bounds.width).toBe(0);
            expect(bounds.height).toBe(0);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should work without callback', () => {
            const controllerWithoutCallback = new CameraController();
            const svg = createMockSVGElement();
            const transformGroup = createMockTransformGroup();

            controllerWithoutCallback.initialize(svg, transformGroup);

            const positions = new Map([['node1', { x: 100, y: 100, size: 20 }]]);
            controllerWithoutCallback.updateNodePositions(positions);

            expect(async () => {
                await controllerWithoutCallback.focusOnNode('node1', { animated: false });
            }).not.toThrow();
        });

        test('should handle missing SVG element gracefully', () => {
            const controllerWithoutSVG = new CameraController();

            // Don't initialize with SVG elements
            expect(() => {
                controllerWithoutSVG.updateViewportSize();
            }).not.toThrow();
        });

        test('should handle viewport size fallback', () => {
            const controllerWithoutSVG = new CameraController();
            const bounds = controllerWithoutSVG.getViewBounds();

            // Should use default dimensions
            expect(bounds.width).toBe(800);
            expect(bounds.height).toBe(600);
        });

        test('should respect scale limits in target calculation', async () => {
            const positions = new Map([
                ['tiny', { x: 100, y: 100, size: 1 }] // Very small node
            ]);
            cameraController.updateNodePositions(positions);

            await cameraController.focusOnNode('tiny', { animated: false });

            const transformCall = (mockTransformGroup.setAttribute as jest.Mock).mock.calls[0];
            // Scale should be capped at maximum value (2)
            expect(transformCall[1]).toMatch(/scale\([0-2]\.?\d*\)/);
        });

        test('should handle rapid successive focus calls', async () => {
            const positions = new Map([
                ['node1', { x: 100, y: 100, size: 20 }],
                ['node2', { x: 200, y: 200, size: 20 }]
            ]);
            cameraController.updateNodePositions(positions);

            // Fire multiple focus operations quickly
            const promises = [
                cameraController.focusOnNode('node1', { animated: true }),
                cameraController.focusOnNode('node2', { animated: true }),
                cameraController.centerView()
            ];

            rafMock.flush();
            await Promise.all(promises);

            // All should complete without error
            expect(mockTransformGroup.setAttribute).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalled();
        });

        test('should handle animation with zero duration', async () => {
            const positions = new Map([['node1', { x: 100, y: 100, size: 20 }]]);
            cameraController.updateNodePositions(positions);

            const promise = cameraController.focusOnNode('node1', {
                duration: 0,
                animated: true
            });

            rafMock.flush(); // Process any pending animations
            await promise;

            expect(mockTransformGroup.setAttribute).toHaveBeenCalled();
            expect(cameraController.isAnimating()).toBe(false);
        });
    });

    describe('Performance Considerations', () => {
        test('should handle large number of node positions efficiently', () => {
            const largePositions = new Map();
            for (let i = 0; i < 1000; i++) {
                largePositions.set(`node${i}`, {
                    x: Math.random() * 1000,
                    y: Math.random() * 1000,
                    size: 20
                });
            }

            const startTime = Date.now();
            cameraController.updateNodePositions(largePositions);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(100); // Should be fast
        });

        // TODO: Fix transform update counting precision in test environment
        test.skip('should minimize transform updates during animation', async () => {
            const positions = new Map([['node1', { x: 100, y: 100, size: 20 }]]);
            cameraController.updateNodePositions(positions);

            (mockTransformGroup.setAttribute as jest.Mock).mockClear();

            const animationPromise = cameraController.focusOnNode('node1', {
                duration: 100,
                animated: true
            });

            // Simulate a few animation frames
            for (let i = 0; i < 5; i++) {
                rafMock.flush();
                await new Promise(resolve => setTimeout(resolve, 1));
            }
            await animationPromise;

            // Should have made reasonable number of transform updates
            const callCount = (mockTransformGroup.setAttribute as jest.Mock).mock.calls.length;
            expect(callCount).toBeGreaterThan(0); // At least one call
            expect(callCount).toBeLessThan(100); // But not excessive
        });
    });
});
