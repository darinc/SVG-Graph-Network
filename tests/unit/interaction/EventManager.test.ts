/**
 * EventManager Tests
 * 
 * Tests the critical interaction handling functionality
 * that was identified as having 0% test coverage
 */

import { EventManager, EventManagerCallbacks } from '../../../src/interaction/EventManager';
import { Node } from '../../../src/Node';
import { Vector } from '../../../src/Vector';
import { NodeData, InteractionConfig } from '../../../src/types/index';

// Mock DOM environment
Object.defineProperty(window, 'addEventListener', {
    value: jest.fn(),
});

Object.defineProperty(window, 'removeEventListener', {
    value: jest.fn(),
});

// Mock document.elementFromPoint for touch event handling
Object.defineProperty(document, 'elementFromPoint', {
    value: jest.fn().mockReturnValue(null),
});

// Mock getBBox for SVG text measurement
Object.defineProperty(SVGElement.prototype, 'getBBox', {
    value: jest.fn().mockReturnValue({
        width: 50,
        height: 20,
        x: 0,
        y: 0
    }),
});

describe('EventManager', () => {
    let eventManager: EventManager<NodeData>;
    let mockSvg: SVGSVGElement;
    let nodes: Map<string, Node<NodeData>>;
    let callbacks: EventManagerCallbacks<NodeData>;
    let mockNode: Node<NodeData>;
    
    beforeEach(() => {
        // Create mock SVG element
        mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        mockSvg.getBoundingClientRect = jest.fn().mockReturnValue({
            left: 0,
            top: 0,
            width: 800,
            height: 600
        });
        
        // Add SVG to document for event testing
        document.body.appendChild(mockSvg);
        
        // Create mock node
        mockNode = new Node<NodeData>({
            id: 'node1',
            name: 'Test Node'
        }, 800, 600);
        mockNode.position = new Vector(100, 100);
        
        // Create nodes map
        nodes = new Map([['node1', mockNode]]);
        
        // Create mock node elements for event binding
        const mockGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        mockGroup.setAttribute('data-id', 'node1');
        mockSvg.appendChild(mockGroup);
        
        // Create callbacks
        callbacks = {
            getNodeElements: jest.fn().mockReturnValue(new Map([[mockNode, { group: mockGroup }]])),
            fixNode: jest.fn(),
            unfixNode: jest.fn(),
            filterByNode: jest.fn(),
            resetFilter: jest.fn(),
            closeSettings: jest.fn(),
            updateTransform: jest.fn(),
            showTooltip: jest.fn(),
            hideTooltip: jest.fn(),
            resize: jest.fn()
        };
        
        // Create event manager
        const config: Partial<InteractionConfig> = {
            zoomSensitivity: 1.1,
            filterDepth: 2
        };
        
        eventManager = new EventManager<NodeData>(config);
    });
    
    afterEach(() => {
        if (eventManager) {
            eventManager.destroy();
        }
        document.body.removeChild(mockSvg);
    });
    
    describe('Initialization', () => {
        test('should initialize with default config', () => {
            const manager = new EventManager();
            expect(manager.getConfig()).toBeDefined();
            expect(manager.getConfig().zoomSensitivity).toBe(1.01);
        });
        
        test('should merge custom config with defaults', () => {
            const config = { zoomSensitivity: 1.5, filterDepth: 3 };
            const manager = new EventManager(config);
            
            const finalConfig = manager.getConfig();
            expect(finalConfig.zoomSensitivity).toBe(1.5);
            expect(finalConfig.filterDepth).toBe(3);
        });
        
        test('should initialize with SVG and nodes', () => {
            expect(() => {
                eventManager.initialize(mockSvg, nodes, callbacks);
            }).not.toThrow();
            
            expect(callbacks.getNodeElements).toHaveBeenCalled();
        });
    });
    
    describe('Transform Management', () => {
        beforeEach(() => {
            eventManager.initialize(mockSvg, nodes, callbacks);
        });
        
        test('should set and get transform state', () => {
            eventManager.setTransform(10, 20, 1.5);
            
            const transform = eventManager.getTransform();
            expect(transform.x).toBe(10);
            expect(transform.y).toBe(20);
            expect(transform.scale).toBe(1.5);
        });
        
        test('should update config', () => {
            const newConfig = { zoomSensitivity: 2.0 };
            eventManager.updateConfig(newConfig);
            
            const config = eventManager.getConfig();
            expect(config.zoomSensitivity).toBe(2.0);
        });
    });
    
    describe('Mouse Events', () => {
        beforeEach(() => {
            eventManager.initialize(mockSvg, nodes, callbacks);
        });
        
        test('should handle mouse wheel zoom', () => {
            const wheelEvent = new WheelEvent('wheel', {
                deltaY: -100,
                clientX: 400,
                clientY: 300,
                bubbles: true
            });
            
            const emitSpy = jest.spyOn(eventManager, 'emit');
            
            mockSvg.dispatchEvent(wheelEvent);
            
            expect(callbacks.updateTransform).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith('zoom', expect.any(Object));
        });
        
        test('should handle background mouse down for panning', () => {
            const mouseDownEvent = new MouseEvent('mousedown', {
                clientX: 400,
                clientY: 300,
                bubbles: true
            });
            
            mockSvg.dispatchEvent(mouseDownEvent);
            
            expect(eventManager.isPanning()).toBe(true);
            expect(callbacks.closeSettings).toHaveBeenCalled();
        });
        
        test('should handle mouse move for panning', () => {
            // Start panning
            const mouseDownEvent = new MouseEvent('mousedown', {
                clientX: 400,
                clientY: 300,
                bubbles: true
            });
            mockSvg.dispatchEvent(mouseDownEvent);
            
            // Move mouse
            const mouseMoveEvent = new MouseEvent('mousemove', {
                clientX: 450,
                clientY: 350,
                bubbles: true
            });
            
            const emitSpy = jest.spyOn(eventManager, 'emit');
            mockSvg.dispatchEvent(mouseMoveEvent);
            
            expect(callbacks.updateTransform).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith('pan', expect.any(Object));
        });
        
        test('should handle mouse up to stop interactions', () => {
            // Start panning
            const mouseDownEvent = new MouseEvent('mousedown', {
                clientX: 400,
                clientY: 300,
                bubbles: true
            });
            mockSvg.dispatchEvent(mouseDownEvent);
            
            expect(eventManager.isPanning()).toBe(true);
            
            // End interaction
            const mouseUpEvent = new MouseEvent('mouseup', {
                bubbles: true
            });
            mockSvg.dispatchEvent(mouseUpEvent);
            
            expect(eventManager.isPanning()).toBe(false);
        });
        
        test('should handle background double click', () => {
            const dblClickEvent = new MouseEvent('dblclick', {
                clientX: 400,
                clientY: 300,
                bubbles: true
            });
            
            const emitSpy = jest.spyOn(eventManager, 'emit');
            mockSvg.dispatchEvent(dblClickEvent);
            
            expect(callbacks.resetFilter).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith('backgroundDoubleClick', expect.any(Object));
        });
    });
    
    describe('Node Interaction', () => {
        let mockNodeGroup: SVGGElement;
        
        beforeEach(() => {
            eventManager.initialize(mockSvg, nodes, callbacks);
            mockNodeGroup = mockSvg.querySelector('g[data-id="node1"]') as SVGGElement;
        });
        
        test('should handle node mouse down for dragging', () => {
            const mouseDownEvent = new MouseEvent('mousedown', {
                clientX: 100,
                clientY: 100,
                bubbles: true
            });
            
            const emitSpy = jest.spyOn(eventManager, 'emit');
            mockNodeGroup.dispatchEvent(mouseDownEvent);
            
            expect(eventManager.isDragging()).toBe(true);
            expect(eventManager.getDraggedNode()).toBe(mockNode);
            expect(callbacks.fixNode).toHaveBeenCalledWith(mockNode);
            expect(emitSpy).toHaveBeenCalledWith('nodeMouseDown', expect.any(Object));
        });
        
        test('should handle node double click for filtering', () => {
            const dblClickEvent = new MouseEvent('dblclick', {
                clientX: 100,
                clientY: 100,
                bubbles: true
            });
            
            const emitSpy = jest.spyOn(eventManager, 'emit');
            mockNodeGroup.dispatchEvent(dblClickEvent);
            
            expect(callbacks.filterByNode).toHaveBeenCalledWith('node1');
            expect(emitSpy).toHaveBeenCalledWith('nodeDoubleClick', expect.any(Object));
        });
        
        test('should handle node dragging', () => {
            // Start dragging
            const mouseDownEvent = new MouseEvent('mousedown', {
                clientX: 100,
                clientY: 100,
                bubbles: true
            });
            mockNodeGroup.dispatchEvent(mouseDownEvent);
            
            // Drag node
            const mouseMoveEvent = new MouseEvent('mousemove', {
                clientX: 150,
                clientY: 150,
                bubbles: true
            });
            
            const emitSpy = jest.spyOn(eventManager, 'emit');
            mockSvg.dispatchEvent(mouseMoveEvent);
            
            expect(callbacks.showTooltip).toHaveBeenCalledWith(mockNode, expect.any(Object));
            expect(emitSpy).toHaveBeenCalledWith('nodeDrag', expect.any(Object));
            
            // Node position should be updated
            expect(mockNode.position.x).toBeCloseTo(150);
            expect(mockNode.position.y).toBeCloseTo(150);
        });
        
        test('should restore node fixed state after dragging', () => {
            // Node starts unfixed
            expect(mockNode.isFixed).toBe(false);
            
            // Start dragging
            const mouseDownEvent = new MouseEvent('mousedown', {
                clientX: 100,
                clientY: 100,
                bubbles: true
            });
            mockNodeGroup.dispatchEvent(mouseDownEvent);
            
            // End dragging
            const mouseUpEvent = new MouseEvent('mouseup', {
                bubbles: true
            });
            mockSvg.dispatchEvent(mouseUpEvent);
            
            expect(callbacks.unfixNode).toHaveBeenCalledWith(mockNode);
            expect(callbacks.hideTooltip).toHaveBeenCalled();
            expect(eventManager.isDragging()).toBe(false);
            expect(eventManager.getDraggedNode()).toBeNull();
        });
    });
    
    describe('Touch Events', () => {
        beforeEach(() => {
            eventManager.initialize(mockSvg, nodes, callbacks);
        });
        
        function createTouch(clientX: number, clientY: number): Touch {
            return {
                clientX,
                clientY,
                identifier: 0,
                pageX: clientX,
                pageY: clientY,
                screenX: clientX,
                screenY: clientY,
                target: mockSvg,
                radiusX: 1,
                radiusY: 1,
                rotationAngle: 0,
                force: 1
            };
        }
        
        test('should handle single touch start for panning', () => {
            const touchEvent = new TouchEvent('touchstart', {
                touches: [createTouch(400, 300)],
                bubbles: true
            });
            
            mockSvg.dispatchEvent(touchEvent);
            
            expect(eventManager.isPanning()).toBe(true);
            expect(callbacks.closeSettings).toHaveBeenCalled();
        });
        
        test('should handle two finger touch for pinching', () => {
            const touchEvent = new TouchEvent('touchstart', {
                touches: [
                    createTouch(350, 300),
                    createTouch(450, 300)
                ],
                bubbles: true
            });
            
            mockSvg.dispatchEvent(touchEvent);
            
            expect(eventManager.isPinching()).toBe(true);
        });
        
        test('should handle touch move for panning', () => {
            // Start single touch
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [createTouch(400, 300)],
                bubbles: true
            });
            mockSvg.dispatchEvent(touchStartEvent);
            
            // Move touch
            const touchMoveEvent = new TouchEvent('touchmove', {
                touches: [createTouch(450, 350)],
                bubbles: true
            });
            
            const emitSpy = jest.spyOn(eventManager, 'emit');
            mockSvg.dispatchEvent(touchMoveEvent);
            
            expect(callbacks.updateTransform).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith('pan', expect.any(Object));
        });
        
        test('should handle pinch zoom', () => {
            // Start pinch
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [
                    createTouch(350, 300),
                    createTouch(450, 300)
                ],
                bubbles: true
            });
            mockSvg.dispatchEvent(touchStartEvent);
            
            // Pinch move (fingers closer together)
            const touchMoveEvent = new TouchEvent('touchmove', {
                touches: [
                    createTouch(380, 300),
                    createTouch(420, 300)
                ],
                bubbles: true
            });
            
            const emitSpy = jest.spyOn(eventManager, 'emit');
            mockSvg.dispatchEvent(touchMoveEvent);
            
            expect(callbacks.updateTransform).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith('zoom', expect.any(Object));
        });
        
        test('should handle touch end', () => {
            // Start touch
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [createTouch(400, 300)],
                bubbles: true
            });
            mockSvg.dispatchEvent(touchStartEvent);
            
            // End touch
            const touchEndEvent = new TouchEvent('touchend', {
                touches: [],
                bubbles: true
            });
            mockSvg.dispatchEvent(touchEndEvent);
            
            expect(eventManager.isPanning()).toBe(false);
        });
        
        test('should detect double tap', (done) => {
            const emitSpy = jest.spyOn(eventManager, 'emit');
            
            // First tap
            const touchStart1 = new TouchEvent('touchstart', {
                touches: [createTouch(400, 300)],
                bubbles: true
            });
            mockSvg.dispatchEvent(touchStart1);
            
            const touchEnd1 = new TouchEvent('touchend', {
                touches: [],
                bubbles: true
            });
            mockSvg.dispatchEvent(touchEnd1);
            
            // Second tap quickly
            setTimeout(() => {
                const touchStart2 = new TouchEvent('touchstart', {
                    touches: [createTouch(400, 300)],
                    bubbles: true
                });
                mockSvg.dispatchEvent(touchStart2);
                
                const touchEnd2 = new TouchEvent('touchend', {
                    touches: [],
                    bubbles: true
                });
                mockSvg.dispatchEvent(touchEnd2);
                
                expect(callbacks.resetFilter).toHaveBeenCalled();
                expect(emitSpy).toHaveBeenCalledWith('backgroundDoubleClick', expect.any(Object));
                done();
            }, 200);
        });
    });
    
    describe('Programmatic Control', () => {
        beforeEach(() => {
            eventManager.initialize(mockSvg, nodes, callbacks);
        });
        
        test('should programmatically zoom', () => {
            const emitSpy = jest.spyOn(eventManager, 'emit');
            
            eventManager.zoomTo(2.0, 400, 300);
            
            const transform = eventManager.getTransform();
            expect(transform.scale).toBe(2.0);
            expect(callbacks.updateTransform).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith('zoom', expect.any(Object));
        });
        
        test('should programmatically pan', () => {
            const emitSpy = jest.spyOn(eventManager, 'emit');
            
            eventManager.panTo(50, 100);
            
            const transform = eventManager.getTransform();
            expect(transform.x).toBe(50);
            expect(transform.y).toBe(100);
            expect(callbacks.updateTransform).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith('pan', expect.any(Object));
        });
        
        test('should stop all interactions', () => {
            // Start dragging
            const mouseDownEvent = new MouseEvent('mousedown', {
                clientX: 100,
                clientY: 100,
                bubbles: true
            });
            const mockNodeGroup = mockSvg.querySelector('g[data-id="node1"]') as SVGGElement;
            mockNodeGroup.dispatchEvent(mouseDownEvent);
            
            expect(eventManager.isDragging()).toBe(true);
            
            eventManager.stopAllInteractions();
            
            expect(eventManager.isDragging()).toBe(false);
            expect(eventManager.isPanning()).toBe(false);
            expect(eventManager.isPinching()).toBe(false);
            expect(callbacks.hideTooltip).toHaveBeenCalled();
        });
    });
    
    describe('Coordinate Conversion', () => {
        beforeEach(() => {
            eventManager.initialize(mockSvg, nodes, callbacks);
            eventManager.setTransform(10, 20, 1.5);
        });
        
        test('should convert screen to SVG coordinates', () => {
            const svgCoords = eventManager.screenToSVG(100, 200);
            
            expect(svgCoords.x).toBeCloseTo((100 - 10) / 1.5);
            expect(svgCoords.y).toBeCloseTo((200 - 20) / 1.5);
        });
        
        test('should convert SVG to screen coordinates', () => {
            const screenCoords = eventManager.svgToScreen(50, 100);
            
            expect(screenCoords.x).toBeCloseTo(50 * 1.5 + 10);
            expect(screenCoords.y).toBeCloseTo(100 * 1.5 + 20);
        });
    });
    
    describe('Event System', () => {
        beforeEach(() => {
            eventManager.initialize(mockSvg, nodes, callbacks);
        });
        
        test('should register and emit custom events', () => {
            const handler = jest.fn();
            
            eventManager.on('customEvent', handler);
            eventManager.emit('customEvent', { data: 'test' });
            
            expect(handler).toHaveBeenCalledWith({ data: 'test' });
        });
        
        test('should remove event listeners', () => {
            const handler = jest.fn();
            
            eventManager.on('testEvent', handler);
            eventManager.emit('testEvent', {});
            expect(handler).toHaveBeenCalledTimes(1);
            
            eventManager.off('testEvent', handler);
            eventManager.emit('testEvent', {});
            expect(handler).toHaveBeenCalledTimes(1); // Should not increase
        });
        
        test('should remove all listeners for an event', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            
            eventManager.on('testEvent', handler1);
            eventManager.on('testEvent', handler2);
            
            eventManager.removeAllListeners('testEvent');
            eventManager.emit('testEvent', {});
            
            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).not.toHaveBeenCalled();
        });
        
        test('should get registered events', () => {
            eventManager.on('event1', jest.fn());
            eventManager.on('event2', jest.fn());
            
            const events = eventManager.getRegisteredEvents();
            expect(events).toContain('event1');
            expect(events).toContain('event2');
        });
    });
    
    describe('Resize Handling', () => {
        test('should handle window resize', () => {
            eventManager.initialize(mockSvg, nodes, callbacks);
            
            // Directly call the handleResize method to test the callback
            (eventManager as any).handleResize();
            
            expect(callbacks.resize).toHaveBeenCalled();
        });
    });
    
    describe('Cleanup', () => {
        test('should clean up on destroy', () => {
            eventManager.initialize(mockSvg, nodes, callbacks);
            
            eventManager.on('testEvent', jest.fn());
            expect(eventManager.getRegisteredEvents().length).toBeGreaterThan(0);
            
            eventManager.destroy();
            
            expect(eventManager.getRegisteredEvents().length).toBe(0);
        });
    });
});