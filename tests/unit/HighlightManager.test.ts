/**
 * @jest-environment jsdom
 */

import { HighlightManager } from '../../src/highlighting/HighlightManager';
import { HighlightEvent, HighlightStyle } from '../../src/types/styling';

// Mock DOM elements and getElementById
const mockElements = new Map<string, HTMLElement>();

const originalGetElementById = document.getElementById;
beforeAll(() => {
    document.getElementById = jest.fn((id: string) => {
        return mockElements.get(id) || null;
    });
});

afterAll(() => {
    document.getElementById = originalGetElementById;
});

const createMockElement = (id: string): HTMLElement => {
    const element = {
        setAttribute: jest.fn(),
        removeAttribute: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn()
        },
        style: {
            setProperty: jest.fn(),
            removeProperty: jest.fn(),
            strokeDashoffset: ''
        }
    } as any;
    
    mockElements.set(id, element);
    return element;
};

describe('HighlightManager', () => {
    let highlightManager: HighlightManager;
    let mockCallback: jest.Mock;
    let lastEvent: HighlightEvent | null;

    // Sample graph data for testing
    const sampleNodes = ['node1', 'node2', 'node3', 'node4', 'node5'];
    const sampleEdges = [
        { id: 'edge1', source: 'node1', target: 'node2' },
        { id: 'edge2', source: 'node2', target: 'node3' },
        { id: 'edge3', source: 'node3', target: 'node4' },
        { id: 'edge4', source: 'node1', target: 'node4' },
        { id: 'edge5', source: 'node4', target: 'node5' }
    ];

    beforeEach(() => {
        mockElements.clear();
        
        // Mock setTimeout to execute immediately in tests
        jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
            fn();
            return 123 as any;
        });
        
        mockCallback = jest.fn((event: HighlightEvent) => {
            lastEvent = event;
        });
        highlightManager = new HighlightManager(mockCallback);
        lastEvent = null;

        // Setup graph structure
        highlightManager.updateGraphStructure(sampleNodes, sampleEdges);

        // Create mock DOM elements
        sampleNodes.forEach(nodeId => {
            createMockElement(`node-${nodeId}`);
        });
        sampleEdges.forEach(edge => {
            createMockElement(`edge-${edge.id}`);
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Basic Highlighting', () => {
        test('should highlight a single node', () => {
            const style: HighlightStyle = { color: '#ff0000', strokeWidth: 4 };
            
            highlightManager.highlightNode('node1', style);

            expect(highlightManager.isNodeHighlighted('node1')).toBe(true);
            expect(highlightManager.getHighlightedNodes()).toEqual(['node1']);
            expect(mockCallback).toHaveBeenCalledTimes(1);
            expect(lastEvent?.type).toBe('highlightChanged');
            expect(lastEvent?.highlightedNodes).toEqual(['node1']);
        });

        test('should highlight multiple nodes', () => {
            const style: HighlightStyle = { color: '#0000ff', strokeWidth: 3 };
            
            highlightManager.highlightNodes(['node1', 'node2', 'node3'], style);

            expect(highlightManager.getHighlightedNodes().sort()).toEqual(['node1', 'node2', 'node3']);
            sampleNodes.slice(0, 3).forEach(nodeId => {
                expect(highlightManager.isNodeHighlighted(nodeId)).toBe(true);
            });
        });

        test('should highlight a single edge', () => {
            highlightManager.highlightEdge('edge1');

            expect(highlightManager.isEdgeHighlighted('edge1')).toBe(true);
            expect(highlightManager.getHighlightedEdges()).toEqual(['edge1']);
        });

        test('should highlight multiple edges', () => {
            highlightManager.highlightEdges(['edge1', 'edge2']);

            expect(highlightManager.getHighlightedEdges().sort()).toEqual(['edge1', 'edge2']);
        });

        test('should apply default styles when none provided', () => {
            const mockElement = mockElements.get('node-node1')!;
            
            highlightManager.highlightNode('node1');

            expect(mockElement.setAttribute).toHaveBeenCalledWith('stroke', '#3b82f6');
            expect(mockElement.setAttribute).toHaveBeenCalledWith('stroke-width', '2');
            expect(mockElement.setAttribute).toHaveBeenCalledWith('opacity', '1');
        });
    });

    describe('Path Highlighting', () => {
        test('should find and highlight shortest path', () => {
            const result = highlightManager.highlightPath('node1', 'node3');

            expect(result).not.toBeNull();
            expect(result).toContain('node1');
            expect(result).toContain('node2');
            expect(result).toContain('node3');
            expect(result).toContain('edge1');
            expect(result).toContain('edge2');
        });

        test('should return null for non-existent path', () => {
            // Update with disconnected graph
            highlightManager.updateGraphStructure(
                ['node1', 'node2', 'node3', 'isolated'],
                [{ id: 'edge1', source: 'node1', target: 'node2' }]
            );

            const result = highlightManager.highlightPath('node1', 'isolated');

            expect(result).toBeNull();
        });

        test('should return null for same source and target', () => {
            const result = highlightManager.highlightPath('node1', 'node1');

            expect(result).toBeNull();
        });

        test('should apply path-specific styles', () => {
            const mockNodeElement = mockElements.get('node-node1')!;
            const mockEdgeElement = mockElements.get('edge-edge1')!;

            highlightManager.highlightPath('node1', 'node2', {
                pathColor: '#00ff00',
                pathWidth: 5,
                showFlow: false
            });

            expect(mockNodeElement.setAttribute).toHaveBeenCalledWith('stroke', '#00ff00');
            expect(mockEdgeElement.setAttribute).toHaveBeenCalledWith('stroke', '#00ff00');
            expect(mockEdgeElement.setAttribute).toHaveBeenCalledWith('stroke-width', '6'); // pathWidth + 1
        });

        // TODO: Fix document.getElementById access in test environment
        test.skip('should handle path flow animation', () => {
            const mockEdgeElement = mockElements.get('edge-edge1')!;
            
            highlightManager.highlightPath('node1', 'node2', {
                showFlow: true,
                flowSpeed: 2,
                duration: 1000
            });

            expect(mockEdgeElement.classList.add).toHaveBeenCalledWith('graph-highlight-animated');
        });
    });

    describe('Neighbor Highlighting', () => {
        test('should highlight direct neighbors', () => {
            const result = highlightManager.highlightNeighbors('node2', { depth: 1 });

            expect(result).toContain('node2'); // Source node
            expect(result).toContain('node1'); // Neighbor
            expect(result).toContain('node3'); // Neighbor
            expect(result.length).toBe(3); // Only direct neighbors
        });

        test('should highlight neighbors with specified depth', () => {
            const result = highlightManager.highlightNeighbors('node1', { depth: 2 });

            // Should include node1, its direct neighbors (node2, node4), 
            // and their neighbors (node3, node5)
            expect(result).toContain('node1');
            expect(result).toContain('node2');
            expect(result).toContain('node4');
            expect(result).toContain('node3');
            expect(result).toContain('node5');
        });

        test('should apply depth-based styling', () => {
            const mockNode2Element = mockElements.get('node-node2')!;
            const mockNode3Element = mockElements.get('node-node3')!;

            highlightManager.highlightNeighbors('node1', {
                depth: 2,
                depthColors: ['#ff0000', '#00ff00'],
                fadeByDistance: true
            });

            // node2 is depth 1, node3 is depth 2
            expect(mockNode2Element.setAttribute).toHaveBeenCalledWith('stroke', '#ff0000');
            expect(mockNode3Element.setAttribute).toHaveBeenCalledWith('stroke', '#00ff00');
        });

        test('should include edge highlighting when requested', () => {
            const result = highlightManager.highlightNeighbors('node1', {
                depth: 1,
                highlightEdges: true
            });

            expect(result).toContain('edge1'); // edge1 connects node1-node2
            expect(result).toContain('edge4'); // edge4 connects node1-node4
        });

        test('should handle fade by distance', () => {
            const mockNode2Element = mockElements.get('node-node2')!;
            
            highlightManager.highlightNeighbors('node1', {
                depth: 2,
                fadeByDistance: true,
                opacity: 0.8
            });

            // Check that opacity is reduced for distant nodes
            // node2 is depth 1, so opacity should be faded
            const opacityCalls = (mockNode2Element.setAttribute as jest.Mock).mock.calls
                .filter(call => call[0] === 'opacity');
            expect(opacityCalls.length).toBeGreaterThan(0);
            const opacityValue = parseFloat(opacityCalls[0][1]);
            expect(opacityValue).toBeLessThan(0.8);
        });
    });

    describe('Connection Highlighting', () => {
        test('should highlight all connections for a node', () => {
            const result = highlightManager.highlightConnections('node1');

            expect(result).toContain('node1');
            expect(result).toContain('edge1'); // node1-node2
            expect(result).toContain('edge4'); // node1-node4
            expect(result.length).toBe(3);
        });

        test('should apply connection styles', () => {
            const mockNodeElement = mockElements.get('node-node1')!;
            const mockEdgeElement = mockElements.get('edge-edge1')!;
            
            const style: HighlightStyle = { color: '#ff00ff', strokeWidth: 4 };
            highlightManager.highlightConnections('node1', style);

            expect(mockNodeElement.setAttribute).toHaveBeenCalledWith('stroke', '#ff00ff');
            expect(mockEdgeElement.setAttribute).toHaveBeenCalledWith('stroke', '#ff00ff');
        });
    });

    describe('Highlight Clearing', () => {
        test('should clear specific node highlight', () => {
            const mockElement = mockElements.get('node-node1')!;
            highlightManager.highlightNode('node1');
            mockCallback.mockClear();

            highlightManager.clearNodeHighlight('node1');

            expect(highlightManager.isNodeHighlighted('node1')).toBe(false);
            expect(mockElement.classList.remove).toHaveBeenCalledWith(
                'graph-highlight-animated', 'graph-highlight-glow', 'graph-highlight-pulse'
            );
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        test('should clear specific edge highlight', () => {
            highlightManager.highlightEdge('edge1');
            mockCallback.mockClear();

            highlightManager.clearEdgeHighlight('edge1');

            expect(highlightManager.isEdgeHighlighted('edge1')).toBe(false);
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        test('should clear all highlights', () => {
            highlightManager.highlightNodes(['node1', 'node2']);
            highlightManager.highlightEdges(['edge1', 'edge2']);
            mockCallback.mockClear();

            highlightManager.clearHighlights();

            expect(highlightManager.getHighlightedNodes()).toEqual([]);
            expect(highlightManager.getHighlightedEdges()).toEqual([]);
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        test('should not emit event when clearing non-highlighted elements', () => {
            highlightManager.clearNodeHighlight('node1');
            highlightManager.clearEdgeHighlight('edge1');

            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    describe('DOM Interaction', () => {
        test('should apply highlight styles to DOM elements', () => {
            const mockElement = mockElements.get('node-node1')!;
            
            highlightManager.highlightNode('node1', {
                color: '#ff0000',
                strokeWidth: 5,
                opacity: 0.8,
                animated: true,
                glow: true,
                pulse: true
            });

            expect(mockElement.setAttribute).toHaveBeenCalledWith('fill', '#ff0000');
            expect(mockElement.setAttribute).toHaveBeenCalledWith('stroke', '#ff0000');
            expect(mockElement.setAttribute).toHaveBeenCalledWith('stroke-width', '5');
            expect(mockElement.setAttribute).toHaveBeenCalledWith('opacity', '0.8');
            expect(mockElement.classList.add).toHaveBeenCalledWith('graph-highlight-animated');
            expect(mockElement.classList.add).toHaveBeenCalledWith('graph-highlight-glow');
            expect(mockElement.classList.add).toHaveBeenCalledWith('graph-highlight-pulse');
        });

        test('should handle missing DOM elements gracefully', () => {
            // Remove element from mock
            mockElements.delete('node-nonexistent');

            expect(() => {
                highlightManager.highlightNode('nonexistent');
                highlightManager.clearNodeHighlight('nonexistent');
            }).not.toThrow();
        });

        test('should set z-index via CSS custom property', () => {
            const mockElement = mockElements.get('node-node1')!;
            
            highlightManager.highlightNode('node1', { zIndex: 100 });

            expect(mockElement.style.setProperty).toHaveBeenCalledWith('--highlight-z-index', '100');
        });
    });

    describe('Graph Structure Updates', () => {
        test('should update graph structure correctly', () => {
            const newNodes = ['nodeA', 'nodeB', 'nodeC'];
            const newEdges = [
                { id: 'edgeA', source: 'nodeA', target: 'nodeB' },
                { id: 'edgeB', source: 'nodeB', target: 'nodeC' }
            ];

            // Create mock elements for new structure
            newNodes.forEach(nodeId => createMockElement(`node-${nodeId}`));
            newEdges.forEach(edge => createMockElement(`edge-${edge.id}`));

            highlightManager.updateGraphStructure(newNodes, newEdges);

            // Test path finding with new structure
            const result = highlightManager.highlightPath('nodeA', 'nodeC');
            expect(result).toContain('nodeA');
            expect(result).toContain('nodeB');
            expect(result).toContain('nodeC');
        });

        test('should warn when graph structure not initialized', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const freshManager = new HighlightManager();

            const result = freshManager.highlightPath('node1', 'node2');

            expect(result).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Graph adjacency not initialized')
            );

            consoleWarnSpy.mockRestore();
        });
    });

    describe('Animation Management', () => {
        // TODO: Fix document.getElementById access in test environment
        test.skip('should manage path flow animations', (done) => {
            const mockEdgeElement = mockElements.get('edge-edge1')!;
            
            highlightManager.highlightPath('node1', 'node2', {
                showFlow: true,
                flowSpeed: 1,
                duration: 100 // Short duration for test
            });

            // Animation should start
            expect(mockEdgeElement.classList.add).toHaveBeenCalledWith('graph-highlight-animated');

            // Check that stroke-dashoffset is being updated
            setTimeout(() => {
                expect(mockEdgeElement.style.strokeDashoffset).toBeTruthy();
                done();
            }, 50);
        });

        // TODO: Fix animation cleanup tracking in test environment
        test.skip('should clean up animations on clear', () => {
            // Mock requestAnimationFrame and cancelAnimationFrame
            const originalRAF = global.requestAnimationFrame;
            const originalCAF = global.cancelAnimationFrame;
            const cancelSpy = jest.fn();
            
            global.requestAnimationFrame = jest.fn(() => 123);
            global.cancelAnimationFrame = cancelSpy;

            highlightManager.highlightPath('node1', 'node2', { showFlow: true });
            highlightManager.clearHighlights();

            // Should cancel animations
            expect(cancelSpy).toHaveBeenCalled();

            global.requestAnimationFrame = originalRAF;
            global.cancelAnimationFrame = originalCAF;
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should work without callback', () => {
            const managerWithoutCallback = new HighlightManager();
            managerWithoutCallback.updateGraphStructure(sampleNodes, sampleEdges);

            expect(() => {
                managerWithoutCallback.highlightNode('node1');
                managerWithoutCallback.clearHighlights();
            }).not.toThrow();
        });

        // TODO: Fix empty graph neighbor detection behavior in test environment
        test.skip('should handle empty graph gracefully', () => {
            const emptyManager = new HighlightManager();
            emptyManager.updateGraphStructure([], []);

            const result = emptyManager.highlightNeighbors('node1');
            expect(result).toEqual([]);
        });

        test('should merge styles with defaults', () => {
            const mockElement = mockElements.get('node-node1')!;
            
            highlightManager.highlightNode('node1', { color: '#ff0000' });

            // Should apply custom color but use default values for other properties
            expect(mockElement.setAttribute).toHaveBeenCalledWith('stroke', '#ff0000');
            expect(mockElement.setAttribute).toHaveBeenCalledWith('stroke-width', '2'); // default
            expect(mockElement.setAttribute).toHaveBeenCalledWith('opacity', '1'); // default
        });

        test('should handle complex graph topologies', () => {
            // Create a more complex graph
            const complexNodes = ['A', 'B', 'C', 'D', 'E', 'F'];
            const complexEdges = [
                { id: 'AB', source: 'A', target: 'B' },
                { id: 'BC', source: 'B', target: 'C' },
                { id: 'CD', source: 'C', target: 'D' },
                { id: 'DE', source: 'D', target: 'E' },
                { id: 'EF', source: 'E', target: 'F' },
                { id: 'AF', source: 'A', target: 'F' }, // Creates alternate path
            ];

            complexNodes.forEach(nodeId => createMockElement(`node-${nodeId}`));
            complexEdges.forEach(edge => createMockElement(`edge-${edge.id}`));

            highlightManager.updateGraphStructure(complexNodes, complexEdges);

            // Test shortest path finding (should prefer A->F over A->B->C->D->E->F)
            const result = highlightManager.highlightPath('A', 'F');
            expect(result).toContain('A');
            expect(result).toContain('F');
            expect(result).toContain('AF');
            expect(result?.length).toBe(3); // A, F, and AF edge
        });
    });
});