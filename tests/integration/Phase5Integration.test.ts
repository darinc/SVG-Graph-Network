/**
 * @jest-environment jsdom
 */

import { GraphNetwork } from '../../src/GraphNetwork';
import { GraphData } from '../../src/types/index';

// Mock DOM container
const createMockContainer = () => {
    const container = document.createElement('div');
    container.id = 'test-graph-container';
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    return container;
};

// Sample test data
const sampleData: GraphData = {
    nodes: [
        { id: 'node1', name: 'Node 1', type: 'primary' },
        { id: 'node2', name: 'Node 2', type: 'secondary' },
        { id: 'node3', name: 'Node 3', type: 'tertiary' },
        { id: 'node4', name: 'Node 4', type: 'primary' }
    ],
    links: [
        { id: 'edge1', source: 'node1', target: 'node2', label: 'Connection 1' },
        { id: 'edge2', source: 'node2', target: 'node3', label: 'Connection 2' },
        { id: 'edge3', source: 'node3', target: 'node4', label: 'Connection 3' },
        { id: 'edge4', source: 'node1', target: 'node4', label: 'Connection 4' }
    ]
};

describe('Phase 5 Integration Tests', () => {
    let container: HTMLElement;
    let graph: GraphNetwork;

    beforeEach(() => {
        // Clean up any existing containers
        const existingContainers = document.querySelectorAll('#test-graph-container');
        existingContainers.forEach(el => el.remove());

        container = createMockContainer();

        graph = new GraphNetwork('test-graph-container', {
            data: JSON.parse(JSON.stringify(sampleData)), // Deep clone
            config: {
                showControls: false,
                showLegend: false,
                showTitle: false
            }
        });

        // Allow graph to initialize
        jest.runOnlyPendingTimers();
    });

    afterEach(() => {
        graph.destroy();
        container.remove();
        jest.clearAllTimers();
    });

    describe('Selection API Integration', () => {
        test('should select and deselect nodes', () => {
            // Test node selection
            const result1 = graph.selectNode('node1');
            expect(result1).toBe(true);
            expect(graph.isNodeSelected('node1')).toBe(true);
            expect(graph.getSelectedNodes()).toEqual(['node1']);

            // Test multiple selection
            const result2 = graph.selectNodes(['node2', 'node3'], { additive: true });
            expect(result2).toEqual(['node2', 'node3']);
            expect(graph.getSelectedNodes().sort()).toEqual(['node1', 'node2', 'node3']);

            // Test deselection
            const result3 = graph.deselectNode('node2');
            expect(result3).toBe(true);
            expect(graph.getSelectedNodes().sort()).toEqual(['node1', 'node3']);

            // Test clear all
            graph.deselectAll();
            expect(graph.getSelectedNodes()).toEqual([]);
        });

        test('should toggle selections', () => {
            // Toggle node selection
            const result1 = graph.toggleNodeSelection('node1');
            expect(result1).toBe(true);
            expect(graph.isNodeSelected('node1')).toBe(true);

            const result2 = graph.toggleNodeSelection('node1');
            expect(result2).toBe(true);
            expect(graph.isNodeSelected('node1')).toBe(false);

            // Toggle edge selection
            const result3 = graph.toggleEdgeSelection('edge1');
            expect(result3).toBe(true);
            expect(graph.isEdgeSelected('edge1')).toBe(true);

            const result4 = graph.toggleEdgeSelection('edge1');
            expect(result4).toBe(true);
            expect(graph.isEdgeSelected('edge1')).toBe(false);
        });

        test('should handle selection modes', () => {
            // Test multi mode (default)
            expect(graph.getSelectionMode()).toBe('multi');

            graph.selectNodes(['node1', 'node2']);
            expect(graph.getSelectedNodes().sort()).toEqual(['node1', 'node2']);

            // Switch to single mode
            graph.setSelectionMode('single');
            expect(graph.getSelectionMode()).toBe('single');
            expect(graph.getSelectedNodes()).toEqual(['node2']); // Should keep last selected

            // Test single mode behavior
            graph.selectNode('node3');
            expect(graph.getSelectedNodes()).toEqual(['node3']);

            // Switch to box mode
            graph.setSelectionMode('box');
            expect(graph.getSelectionMode()).toBe('box');
        });
    });

    describe('Styling API Integration', () => {
        test('should apply node styles', () => {
            graph.setNodeStyle('node1', {
                fill: '#ff0000',
                stroke: '#000000',
                strokeWidth: 3,
                opacity: 0.8,
                size: 30
            });

            const style = graph.getNodeStyle('node1');
            expect(style).toMatchObject({
                fill: '#ff0000',
                stroke: '#000000',
                strokeWidth: 3,
                opacity: 0.8,
                size: 30
            });
        });

        test('should reset styles', () => {
            // Apply some styles
            graph.setNodeStyle('node1', { fill: '#ff0000', strokeWidth: 5 });
            graph.setEdgeStyle('edge1', { stroke: '#0000ff', strokeWidth: 3 });

            // Reset specific elements
            graph.resetStyle(['node1']);
            expect(graph.getNodeStyle('node1')).toBeNull();
            expect(graph.getEdgeStyle('edge1')).not.toBeNull();

            // Reset all styles
            graph.resetStyle();
            expect(graph.getEdgeStyle('edge1')).toBeNull();
        });
    });

    describe('Highlighting API Integration', () => {
        test('should clear highlights', () => {
            // Add various highlights
            graph.highlightNodes(['node1', 'node2']);
            graph.highlightEdges(['edge1', 'edge2']);

            expect(graph.getHighlightedNodes()).toHaveLength(2);
            expect(graph.getHighlightedEdges()).toHaveLength(2);

            // Clear specific highlights
            graph.clearNodeHighlight('node1');
            expect(graph.isNodeHighlighted('node1')).toBe(false);
            expect(graph.getHighlightedNodes()).toEqual(['node2']);

            graph.clearEdgeHighlight('edge1');
            expect(graph.isEdgeHighlighted('edge1')).toBe(false);
            expect(graph.getHighlightedEdges()).toEqual(['edge2']);

            // Clear all highlights
            graph.clearHighlights();
            expect(graph.getHighlightedNodes()).toEqual([]);
            expect(graph.getHighlightedEdges()).toEqual([]);
        });
    });

    describe('Focus/Camera API Integration', () => {
        test('should fit to view', async () => {
            await graph.fitToView(100);

            // Should complete without error
            expect(true).toBe(true);
        });

        test('should center view', async () => {
            await graph.centerView();

            // Should complete without error
            expect(true).toBe(true);
        });
    });

    describe('Cross-Feature Integration', () => {
        test('should coordinate selection and highlighting', () => {
            // Select some nodes
            graph.selectNodes(['node1', 'node2']);

            // Highlight some nodes (including one selected)
            graph.highlightNodes(['node2', 'node3']);

            // Both systems should work independently
            expect(graph.getSelectedNodes().sort()).toEqual(['node1', 'node2']);
            expect(graph.getHighlightedNodes().sort()).toEqual(['node2', 'node3']);
            expect(graph.isNodeSelected('node1')).toBe(true);
            expect(graph.isNodeHighlighted('node1')).toBe(false);
            expect(graph.isNodeSelected('node2')).toBe(true);
            expect(graph.isNodeHighlighted('node2')).toBe(true);
        });

        test('should combine styling with selection', () => {
            // Apply base styling
            graph.setNodeStyle('node1', { fill: '#ff0000', strokeWidth: 2 });

            // Select the node (which applies selection styling)
            graph.selectNode('node1');

            // Both should be tracked independently
            expect(graph.getNodeStyle('node1')?.fill).toBe('#ff0000');
            expect(graph.isNodeSelected('node1')).toBe(true);
        });

        test('should maintain state through data changes', () => {
            // Apply various states
            graph.selectNodes(['node1', 'node2']);
            graph.highlightNodes(['node2', 'node3']);
            graph.setNodeStyle('node1', { fill: '#ff0000' });

            // Add a new node
            graph.addNode({ id: 'node5', name: 'Node 5', type: 'primary' });

            // Previous states should persist
            expect(graph.getSelectedNodes().sort()).toEqual(['node1', 'node2']);
            expect(graph.getHighlightedNodes().sort()).toEqual(['node2', 'node3']);
            expect(graph.getNodeStyle('node1')?.fill).toBe('#ff0000');
        });
    });

    describe('Performance and Memory', () => {
        test('should handle large number of selections efficiently', () => {
            // Add more nodes for testing
            const additionalNodes = Array.from({ length: 100 }, (_, i) => ({
                id: `bulk${i}`,
                name: `Bulk Node ${i}`,
                type: 'tertiary'
            }));

            additionalNodes.forEach(node => graph.addNode(node));

            const startTime = Date.now();

            // Select many nodes
            const nodeIds = additionalNodes.map(n => n.id);
            graph.selectNodes(nodeIds);

            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(1000); // Should be reasonably fast
            expect(graph.getSelectedNodes()).toHaveLength(100);
        });

        test('should clean up properly on destroy', () => {
            // Apply various states
            graph.selectNodes(['node1', 'node2']);
            graph.highlightNodes(['node1', 'node3']);
            graph.setNodeStyle('node1', { fill: '#ff0000' });

            // Destroy should not throw
            expect(() => graph.destroy()).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid focus targets gracefully', async () => {
            await expect(graph.focusOnNode('nonexistent')).rejects.toThrow();

            await expect(graph.focusOnNodes(['nonexistent1', 'nonexistent2'])).rejects.toThrow();

            await expect(graph.focusOnNodes([])).rejects.toThrow();
        });
    });
});
