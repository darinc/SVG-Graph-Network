/**
 * @jest-environment jsdom
 */

import { SelectionManager } from '../../src/selection/SelectionManager';
import { SelectionEvent } from '../../src/types/styling';

describe('SelectionManager', () => {
    let selectionManager: SelectionManager;
    let mockCallback: jest.Mock;
    let lastEvent: SelectionEvent | null;

    beforeEach(() => {
        // Mock setTimeout to execute immediately in tests
        jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
            fn();
            return 123 as any;
        });
        
        mockCallback = jest.fn((event: SelectionEvent) => {
            lastEvent = event;
        });
        selectionManager = new SelectionManager(mockCallback);
        lastEvent = null;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Node Selection', () => {
        test('should select a single node', () => {
            const result = selectionManager.selectNode('node1');
            
            expect(result).toBe(true);
            expect(selectionManager.isNodeSelected('node1')).toBe(true);
            expect(selectionManager.getSelectedNodes()).toEqual(['node1']);
            expect(mockCallback).toHaveBeenCalledTimes(1);
            expect(lastEvent?.type).toBe('selectionChanged');
            expect(lastEvent?.selectedNodes).toEqual(['node1']);
            expect(lastEvent?.addedNodes).toEqual(['node1']);
        });

        test('should not emit event when selecting already selected node', () => {
            selectionManager.selectNode('node1');
            mockCallback.mockClear();
            
            const result = selectionManager.selectNode('node1');
            
            expect(result).toBe(false);
            expect(mockCallback).not.toHaveBeenCalled();
        });

        test('should select multiple nodes', () => {
            const result = selectionManager.selectNodes(['node1', 'node2', 'node3']);
            
            expect(result).toEqual(['node1', 'node2', 'node3']);
            expect(selectionManager.getSelectedNodes().sort()).toEqual(['node1', 'node2', 'node3']);
            expect(lastEvent?.addedNodes.sort()).toEqual(['node1', 'node2', 'node3']);
        });

        test('should handle mixed new and existing selections', () => {
            selectionManager.selectNode('node1');
            mockCallback.mockClear();
            
            const result = selectionManager.selectNodes(['node1', 'node2'], { additive: true });
            
            expect(result).toEqual(['node2']);
            expect(selectionManager.getSelectedNodes().sort()).toEqual(['node1', 'node2']);
        });

        test('should replace selection in single mode', () => {
            selectionManager.setSelectionMode('single');
            selectionManager.selectNode('node1');
            mockCallback.mockClear();
            
            selectionManager.selectNode('node2');
            
            expect(selectionManager.getSelectedNodes()).toEqual(['node2']);
            expect(selectionManager.isNodeSelected('node1')).toBe(false);
        });

        test('should toggle node selection', () => {
            const result1 = selectionManager.toggleNodeSelection('node1');
            expect(result1).toBe(true);
            expect(selectionManager.isNodeSelected('node1')).toBe(true);
            
            const result2 = selectionManager.toggleNodeSelection('node1');
            expect(result2).toBe(true);
            expect(selectionManager.isNodeSelected('node1')).toBe(false);
        });

        test('should deselect node', () => {
            selectionManager.selectNode('node1');
            mockCallback.mockClear();
            
            const result = selectionManager.deselectNode('node1');
            
            expect(result).toBe(true);
            expect(selectionManager.isNodeSelected('node1')).toBe(false);
            expect(lastEvent?.removedNodes).toEqual(['node1']);
        });

        test('should not deselect non-selected node', () => {
            const result = selectionManager.deselectNode('node1');
            
            expect(result).toBe(false);
            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    describe('Edge Selection', () => {
        test('should select a single edge', () => {
            const result = selectionManager.selectEdge('edge1');
            
            expect(result).toBe(true);
            expect(selectionManager.isEdgeSelected('edge1')).toBe(true);
            expect(selectionManager.getSelectedEdges()).toEqual(['edge1']);
            expect(lastEvent?.addedEdges).toEqual(['edge1']);
        });

        test('should select multiple edges', () => {
            const result = selectionManager.selectEdges(['edge1', 'edge2']);
            
            expect(result).toEqual(['edge1', 'edge2']);
            expect(selectionManager.getSelectedEdges().sort()).toEqual(['edge1', 'edge2']);
        });

        test('should toggle edge selection', () => {
            const result1 = selectionManager.toggleEdgeSelection('edge1');
            expect(result1).toBe(true);
            expect(selectionManager.isEdgeSelected('edge1')).toBe(true);
            
            const result2 = selectionManager.toggleEdgeSelection('edge1');
            expect(result2).toBe(true);
            expect(selectionManager.isEdgeSelected('edge1')).toBe(false);
        });

        test('should deselect edge', () => {
            selectionManager.selectEdge('edge1');
            mockCallback.mockClear();
            
            const result = selectionManager.deselectEdge('edge1');
            
            expect(result).toBe(true);
            expect(selectionManager.isEdgeSelected('edge1')).toBe(false);
            expect(lastEvent?.removedEdges).toEqual(['edge1']);
        });
    });

    describe('Selection Management', () => {
        test('should clear all selections', () => {
            selectionManager.selectNodes(['node1', 'node2']);
            selectionManager.selectEdges(['edge1', 'edge2']);
            mockCallback.mockClear();
            
            selectionManager.deselectAll();
            
            expect(selectionManager.getSelectedNodes()).toEqual([]);
            expect(selectionManager.getSelectedEdges()).toEqual([]);
            expect(selectionManager.hasSelection()).toBe(false);
            expect(lastEvent?.removedNodes.sort()).toEqual(['node1', 'node2']);
            expect(lastEvent?.removedEdges.sort()).toEqual(['edge1', 'edge2']);
        });

        test('should get selection count', () => {
            selectionManager.selectNodes(['node1', 'node2']);
            selectionManager.selectEdges(['edge1']);
            
            const count = selectionManager.getSelectionCount();
            
            expect(count.nodes).toBe(2);
            expect(count.edges).toBe(1);
            expect(count.total).toBe(3);
        });

        test('should get complete selection state', () => {
            selectionManager.selectNodes(['node1', 'node2']);
            selectionManager.selectEdge('edge1');
            
            const state = selectionManager.getSelectionState();
            
            expect(Array.from(state.selectedNodes).sort()).toEqual(['node1', 'node2']);
            expect(Array.from(state.selectedEdges)).toEqual(['edge1']);
            expect(state.lastSelected).toBe('node2');
            expect(state.mode).toBe('multi');
        });
    });

    describe('Selection Modes', () => {
        test('should change selection mode', () => {
            selectionManager.setSelectionMode('single');
            expect(selectionManager.getSelectionMode()).toBe('single');
            
            selectionManager.setSelectionMode('box');
            expect(selectionManager.getSelectionMode()).toBe('box');
        });

        test('should reduce to single selection when switching to single mode', () => {
            selectionManager.selectNodes(['node1', 'node2', 'node3']);
            mockCallback.mockClear();
            
            selectionManager.setSelectionMode('single');
            
            expect(selectionManager.getSelectedNodes()).toEqual(['node3']); // Last selected
            expect(mockCallback).toHaveBeenCalled();
            expect(lastEvent?.removedNodes.sort()).toEqual(['node1', 'node2']);
        });

        test('should clear edges when switching to single mode', () => {
            selectionManager.selectNodes(['node1']);
            selectionManager.selectEdges(['edge1', 'edge2']);
            mockCallback.mockClear();
            
            selectionManager.setSelectionMode('single');
            
            expect(selectionManager.getSelectedEdges()).toEqual([]);
            expect(lastEvent?.removedEdges.sort()).toEqual(['edge1', 'edge2']);
        });
    });

    describe('Data Change Updates', () => {
        test('should clean up selections after data change', () => {
            selectionManager.selectNodes(['node1', 'node2', 'node3']);
            selectionManager.selectEdges(['edge1', 'edge2', 'edge3']);
            mockCallback.mockClear();
            
            // Simulate data change where node2 and edge2 are removed
            const existingNodes = new Set(['node1', 'node3']);
            const existingEdges = new Set(['edge1', 'edge3']);
            
            selectionManager.updateAfterDataChange(existingNodes, existingEdges);
            
            expect(selectionManager.getSelectedNodes().sort()).toEqual(['node1', 'node3']);
            expect(selectionManager.getSelectedEdges().sort()).toEqual(['edge1', 'edge3']);
            expect(lastEvent?.removedNodes).toEqual(['node2']);
            expect(lastEvent?.removedEdges).toEqual(['edge2']);
        });

        test('should update last selected when it is removed', () => {
            selectionManager.selectNodes(['node1', 'node2']);
            // node2 should be lastSelected
            
            const existingNodes = new Set(['node1']);
            const existingEdges = new Set<string>();
            
            selectionManager.updateAfterDataChange(existingNodes, existingEdges);
            
            const state = selectionManager.getSelectionState();
            expect(state.lastSelected).toBeUndefined();
        });
    });

    describe('Options Handling', () => {
        test('should respect additive option', () => {
            selectionManager.selectNode('node1');
            mockCallback.mockClear();
            
            selectionManager.selectNode('node2', { additive: true });
            
            expect(selectionManager.getSelectedNodes().sort()).toEqual(['node1', 'node2']);
        });

        test('should respect silent option', () => {
            const result = selectionManager.selectNode('node1', { silent: true });
            
            expect(result).toBe(true);
            expect(selectionManager.isNodeSelected('node1')).toBe(true);
            expect(mockCallback).not.toHaveBeenCalled();
        });

        test('should use custom highlight options', () => {
            selectionManager.selectNode('node1', {
                highlightColor: '#ff0000',
                strokeWidth: 5,
                animationDuration: 500
            });
            
            expect(mockCallback).toHaveBeenCalled();
            expect(selectionManager.isNodeSelected('node1')).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty arrays gracefully', () => {
            const result = selectionManager.selectNodes([]);
            expect(result).toEqual([]);
            expect(mockCallback).not.toHaveBeenCalled();
        });

        test('should work without callback', () => {
            const managerWithoutCallback = new SelectionManager();
            
            expect(() => {
                managerWithoutCallback.selectNode('node1');
                managerWithoutCallback.deselectAll();
            }).not.toThrow();
        });

        test('should handle rapid selection changes', () => {
            // Simulate rapid user interactions
            for (let i = 0; i < 10; i++) {
                selectionManager.toggleNodeSelection('node1');
            }
            
            expect(selectionManager.isNodeSelected('node1')).toBe(false);
            expect(mockCallback).toHaveBeenCalledTimes(10);
        });
    });
});