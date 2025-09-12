/**
 * SelectionManager - Handles multi-selection state and operations
 *
 * Provides centralized selection management with support for:
 * - Single and multi-selection modes
 * - Selection persistence during data updates
 * - Event emission for selection changes
 * - Visual feedback coordination
 */
import { ISelectionManager, SelectionOptions, SelectionState, SelectionEvent } from '../types/styling';
/**
 * Selection change callback type
 */
export type SelectionChangeCallback = (event: SelectionEvent) => void;
/**
 * SelectionManager handles all selection state and operations
 */
export declare class SelectionManager implements ISelectionManager {
    private state;
    private readonly onSelectionChange?;
    private readonly options;
    /**
     * Create a new SelectionManager
     * @param onSelectionChange - Callback for selection changes
     * @param defaultOptions - Default options for selections
     */
    constructor(onSelectionChange?: SelectionChangeCallback, defaultOptions?: Partial<SelectionOptions>);
    /**
     * Select a single node
     */
    selectNode(nodeId: string, options?: SelectionOptions): boolean;
    /**
     * Select multiple nodes
     */
    selectNodes(nodeIds: string[], options?: SelectionOptions): string[];
    /**
     * Select a single edge
     */
    selectEdge(edgeId: string, options?: SelectionOptions): boolean;
    /**
     * Select multiple edges
     */
    selectEdges(edgeIds: string[], options?: SelectionOptions): string[];
    /**
     * Deselect a node
     */
    deselectNode(nodeId: string): boolean;
    /**
     * Deselect an edge
     */
    deselectEdge(edgeId: string): boolean;
    /**
     * Deselect all nodes and edges
     */
    deselectAll(): void;
    /**
     * Toggle node selection
     */
    toggleNodeSelection(nodeId: string): boolean;
    /**
     * Toggle edge selection
     */
    toggleEdgeSelection(edgeId: string): boolean;
    /**
     * Check if node is selected
     */
    isNodeSelected(nodeId: string): boolean;
    /**
     * Check if edge is selected
     */
    isEdgeSelected(edgeId: string): boolean;
    /**
     * Get all selected node IDs
     */
    getSelectedNodes(): string[];
    /**
     * Get all selected edge IDs
     */
    getSelectedEdges(): string[];
    /**
     * Get complete selection state
     */
    getSelectionState(): SelectionState;
    /**
     * Clear all selections (alias for deselectAll)
     */
    clearSelection(): void;
    /**
     * Set selection mode
     */
    setSelectionMode(mode: 'single' | 'multi' | 'box'): void;
    /**
     * Get current selection mode
     */
    getSelectionMode(): 'single' | 'multi' | 'box';
    /**
     * Check if any elements are selected
     */
    hasSelection(): boolean;
    /**
     * Get selection count
     */
    getSelectionCount(): {
        nodes: number;
        edges: number;
        total: number;
    };
    /**
     * Update selections after data changes (remove non-existent elements)
     */
    updateAfterDataChange(existingNodeIds: Set<string>, existingEdgeIds: Set<string>): void;
    /**
     * Emit selection change event
     */
    private emitSelectionChange;
}
//# sourceMappingURL=SelectionManager.d.ts.map