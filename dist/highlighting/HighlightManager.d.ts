/**
 * HighlightManager - Handles element highlighting with path finding
 *
 * Provides advanced highlighting capabilities with support for:
 * - Individual element highlighting with custom styles
 * - Path highlighting between nodes with pathfinding
 * - Neighbor highlighting with configurable depth
 * - Connection highlighting for node relationships
 * - Animated highlight effects and transitions
 */
import { IHighlightManager, HighlightStyle, PathHighlightOptions, NeighborHighlightOptions, HighlightEvent } from '../types/styling';
/**
 * Highlight change callback type
 */
export type HighlightChangeCallback = (event: HighlightEvent) => void;
/**
 * HighlightManager handles all highlighting operations
 */
export declare class HighlightManager implements IHighlightManager {
    private state;
    private readonly onHighlightChange?;
    private graphAdjacency?;
    private animationCounter;
    /**
     * Create a new HighlightManager
     * @param onHighlightChange - Callback for highlight changes
     */
    constructor(onHighlightChange?: HighlightChangeCallback);
    /**
     * Highlight a single node
     */
    highlightNode(nodeId: string, style?: HighlightStyle): void;
    /**
     * Highlight multiple nodes
     */
    highlightNodes(nodeIds: string[], style?: HighlightStyle): void;
    /**
     * Highlight a single edge
     */
    highlightEdge(edgeId: string, style?: HighlightStyle): void;
    /**
     * Highlight multiple edges
     */
    highlightEdges(edgeIds: string[], style?: HighlightStyle): void;
    /**
     * Highlight shortest path between two nodes
     */
    highlightPath(sourceId: string, targetId: string, options?: PathHighlightOptions): string[] | null;
    /**
     * Highlight neighbors of a node with configurable depth
     */
    highlightNeighbors(nodeId: string, options?: NeighborHighlightOptions): string[];
    /**
     * Highlight all connections (edges) for a node
     */
    highlightConnections(nodeId: string, style?: HighlightStyle): string[];
    /**
     * Clear all highlights
     */
    clearHighlights(): void;
    /**
     * Clear highlight for a specific node
     */
    clearNodeHighlight(nodeId: string): void;
    /**
     * Clear highlight for a specific edge
     */
    clearEdgeHighlight(edgeId: string): void;
    /**
     * Check if node is currently highlighted
     */
    isNodeHighlighted(nodeId: string): boolean;
    /**
     * Check if edge is currently highlighted
     */
    isEdgeHighlighted(edgeId: string): boolean;
    /**
     * Get all highlighted node IDs
     */
    getHighlightedNodes(): string[];
    /**
     * Get all highlighted edge IDs
     */
    getHighlightedEdges(): string[];
    /**
     * Update graph structure for pathfinding
     */
    updateGraphStructure(nodes: string[], edges: Array<{
        id: string;
        source: string;
        target: string;
    }>): void;
    /**
     * Find shortest path between two nodes using BFS
     */
    private findShortestPath;
    /**
     * Find edge ID between two nodes
     */
    private findEdgeBetweenNodes;
    /**
     * Get depth-based style for neighbor highlighting
     */
    private getDepthBasedStyle;
    /**
     * Animate flow along path
     */
    private animatePathFlow;
    /**
     * Apply highlight style to DOM element
     */
    private applyHighlightToElement;
    /**
     * Clear highlight from DOM element
     */
    private clearElementHighlight;
    /**
     * Merge style with defaults
     */
    private mergeWithDefaults;
    /**
     * Emit highlight change event
     */
    private emitHighlightChange;
}
//# sourceMappingURL=HighlightManager.d.ts.map