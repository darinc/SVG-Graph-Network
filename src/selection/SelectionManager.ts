/**
 * SelectionManager - Handles multi-selection state and operations
 * 
 * Provides centralized selection management with support for:
 * - Single and multi-selection modes
 * - Selection persistence during data updates  
 * - Event emission for selection changes
 * - Visual feedback coordination
 */

import { 
    ISelectionManager, 
    SelectionOptions, 
    SelectionState, 
    SelectionEvent 
} from '../types/styling';

/**
 * Default selection options
 */
const DEFAULT_SELECTION_OPTIONS: Required<SelectionOptions> = {
    additive: false,
    highlightColor: '#3b82f6',
    strokeWidth: 3,
    silent: false,
    animationDuration: 200
};

/**
 * Selection change callback type
 */
export type SelectionChangeCallback = (event: SelectionEvent) => void;

/**
 * SelectionManager handles all selection state and operations
 */
export class SelectionManager implements ISelectionManager {
    private state: SelectionState;
    private readonly onSelectionChange?: SelectionChangeCallback;
    private readonly options: Required<SelectionOptions>;

    /**
     * Create a new SelectionManager
     * @param onSelectionChange - Callback for selection changes
     * @param defaultOptions - Default options for selections
     */
    constructor(
        onSelectionChange?: SelectionChangeCallback,
        defaultOptions?: Partial<SelectionOptions>
    ) {
        this.state = {
            selectedNodes: new Set<string>(),
            selectedEdges: new Set<string>(),
            mode: 'multi'
        };
        
        this.onSelectionChange = onSelectionChange;
        this.options = { ...DEFAULT_SELECTION_OPTIONS, ...defaultOptions };
    }

    /**
     * Select a single node
     */
    selectNode(nodeId: string, options?: SelectionOptions): boolean {
        if (!nodeId) return false;
        
        const opts = { ...this.options, ...options };
        const wasSelected = this.state.selectedNodes.has(nodeId);
        
        if (!opts.additive && this.state.mode === 'single') {
            this.state.selectedNodes.clear();
        }
        
        this.state.selectedNodes.add(nodeId);
        this.state.lastSelected = nodeId;
        
        if (!wasSelected) {
            this.emitSelectionChange(opts, [nodeId], [], [], []);
            return true;
        }
        
        return false;
    }

    /**
     * Select multiple nodes
     */
    selectNodes(nodeIds: string[], options?: SelectionOptions): string[] {
        const opts = { ...this.options, ...options };
        const newSelections: string[] = [];
        
        if (!opts.additive) {
            this.state.selectedNodes.clear();
        }
        
        for (const nodeId of nodeIds) {
            if (!this.state.selectedNodes.has(nodeId)) {
                this.state.selectedNodes.add(nodeId);
                newSelections.push(nodeId);
            }
        }
        
        if (newSelections.length > 0) {
            this.state.lastSelected = newSelections[newSelections.length - 1];
            this.emitSelectionChange(opts, newSelections, [], [], []);
        }
        
        return newSelections;
    }

    /**
     * Select a single edge
     */
    selectEdge(edgeId: string, options?: SelectionOptions): boolean {
        const opts = { ...this.options, ...options };
        const wasSelected = this.state.selectedEdges.has(edgeId);
        
        if (!opts.additive && this.state.mode === 'single') {
            this.state.selectedEdges.clear();
        }
        
        this.state.selectedEdges.add(edgeId);
        
        if (!wasSelected) {
            this.emitSelectionChange(opts, [], [], [edgeId], []);
            return true;
        }
        
        return false;
    }

    /**
     * Select multiple edges
     */
    selectEdges(edgeIds: string[], options?: SelectionOptions): string[] {
        const opts = { ...this.options, ...options };
        const newSelections: string[] = [];
        
        if (!opts.additive) {
            this.state.selectedEdges.clear();
        }
        
        for (const edgeId of edgeIds) {
            if (!this.state.selectedEdges.has(edgeId)) {
                this.state.selectedEdges.add(edgeId);
                newSelections.push(edgeId);
            }
        }
        
        if (newSelections.length > 0) {
            this.emitSelectionChange(opts, [], [], newSelections, []);
        }
        
        return newSelections;
    }

    /**
     * Deselect a node
     */
    deselectNode(nodeId: string): boolean {
        if (this.state.selectedNodes.has(nodeId)) {
            this.state.selectedNodes.delete(nodeId);
            this.emitSelectionChange(this.options, [], [nodeId], [], []);
            return true;
        }
        return false;
    }

    /**
     * Deselect an edge
     */
    deselectEdge(edgeId: string): boolean {
        if (this.state.selectedEdges.has(edgeId)) {
            this.state.selectedEdges.delete(edgeId);
            this.emitSelectionChange(this.options, [], [], [], [edgeId]);
            return true;
        }
        return false;
    }

    /**
     * Deselect all nodes and edges
     */
    deselectAll(): void {
        const removedNodes = Array.from(this.state.selectedNodes);
        const removedEdges = Array.from(this.state.selectedEdges);
        
        this.state.selectedNodes.clear();
        this.state.selectedEdges.clear();
        this.state.lastSelected = undefined;
        
        if (removedNodes.length > 0 || removedEdges.length > 0) {
            this.emitSelectionChange(this.options, [], removedNodes, [], removedEdges);
        }
    }

    /**
     * Toggle node selection
     */
    toggleNodeSelection(nodeId: string): boolean {
        if (this.state.selectedNodes.has(nodeId)) {
            return this.deselectNode(nodeId);
        } else {
            return this.selectNode(nodeId, { additive: true });
        }
    }

    /**
     * Toggle edge selection
     */
    toggleEdgeSelection(edgeId: string): boolean {
        if (this.state.selectedEdges.has(edgeId)) {
            return this.deselectEdge(edgeId);
        } else {
            return this.selectEdge(edgeId, { additive: true });
        }
    }

    /**
     * Check if node is selected
     */
    isNodeSelected(nodeId: string): boolean {
        return this.state.selectedNodes.has(nodeId);
    }

    /**
     * Check if edge is selected
     */
    isEdgeSelected(edgeId: string): boolean {
        return this.state.selectedEdges.has(edgeId);
    }

    /**
     * Get all selected node IDs
     */
    getSelectedNodes(): string[] {
        return Array.from(this.state.selectedNodes);
    }

    /**
     * Get all selected edge IDs
     */
    getSelectedEdges(): string[] {
        return Array.from(this.state.selectedEdges);
    }

    /**
     * Get complete selection state
     */
    getSelectionState(): SelectionState {
        return {
            selectedNodes: new Set(this.state.selectedNodes),
            selectedEdges: new Set(this.state.selectedEdges),
            lastSelected: this.state.lastSelected,
            mode: this.state.mode
        };
    }

    /**
     * Clear all selections (alias for deselectAll)
     */
    clearSelection(): void {
        this.deselectAll();
    }

    /**
     * Set selection mode
     */
    setSelectionMode(mode: 'single' | 'multi' | 'box'): void {
        this.state.mode = mode;
        
        // If switching to single mode and multiple items are selected,
        // keep only the last selected item
        if (mode === 'single') {
            if (this.state.selectedNodes.size > 1) {
                const lastNode = this.state.lastSelected;
                const removedNodes = Array.from(this.state.selectedNodes).filter(id => id !== lastNode);
                
                this.state.selectedNodes.clear();
                if (lastNode) {
                    this.state.selectedNodes.add(lastNode);
                }
                
                if (removedNodes.length > 0) {
                    this.emitSelectionChange(this.options, [], removedNodes, [], []);
                }
            }
            
            // Also clear edge selections in single mode (for simplicity)
            if (this.state.selectedEdges.size > 0) {
                const removedEdges = Array.from(this.state.selectedEdges);
                this.state.selectedEdges.clear();
                this.emitSelectionChange(this.options, [], [], [], removedEdges);
            }
        }
    }

    /**
     * Get current selection mode
     */
    getSelectionMode(): 'single' | 'multi' | 'box' {
        return this.state.mode;
    }

    /**
     * Check if any elements are selected
     */
    hasSelection(): boolean {
        return this.state.selectedNodes.size > 0 || this.state.selectedEdges.size > 0;
    }

    /**
     * Get selection count
     */
    getSelectionCount(): { nodes: number; edges: number; total: number } {
        const nodes = this.state.selectedNodes.size;
        const edges = this.state.selectedEdges.size;
        return { nodes, edges, total: nodes + edges };
    }

    /**
     * Update selections after data changes (remove non-existent elements)
     */
    updateAfterDataChange(existingNodeIds: Set<string>, existingEdgeIds: Set<string>): void {
        const removedNodes: string[] = [];
        const removedEdges: string[] = [];
        
        // Remove selected nodes that no longer exist
        for (const nodeId of this.state.selectedNodes) {
            if (!existingNodeIds.has(nodeId)) {
                this.state.selectedNodes.delete(nodeId);
                removedNodes.push(nodeId);
            }
        }
        
        // Remove selected edges that no longer exist
        for (const edgeId of this.state.selectedEdges) {
            if (!existingEdgeIds.has(edgeId)) {
                this.state.selectedEdges.delete(edgeId);
                removedEdges.push(edgeId);
            }
        }
        
        // Update last selected if it was removed
        if (this.state.lastSelected && !existingNodeIds.has(this.state.lastSelected)) {
            this.state.lastSelected = undefined;
        }
        
        // Emit change event if selections were cleaned up
        if (removedNodes.length > 0 || removedEdges.length > 0) {
            this.emitSelectionChange(this.options, [], removedNodes, [], removedEdges);
        }
    }

    /**
     * Emit selection change event
     */
    private emitSelectionChange(
        options: Required<SelectionOptions>,
        addedNodes: string[],
        removedNodes: string[],
        addedEdges: string[],
        removedEdges: string[]
    ): void {
        if (options.silent || !this.onSelectionChange) return;

        const event: SelectionEvent = {
            type: 'selectionChanged',
            selectedNodes: Array.from(this.state.selectedNodes),
            selectedEdges: Array.from(this.state.selectedEdges),
            addedNodes,
            removedNodes,
            addedEdges,
            removedEdges,
            timestamp: Date.now()
        };

        // Use a small delay to allow for batching of rapid selection changes
        if (typeof setTimeout !== 'undefined') {
            setTimeout(() => this.onSelectionChange!(event), 0);
        } else {
            // For testing environment without setTimeout
            this.onSelectionChange!(event);
        }
    }
}