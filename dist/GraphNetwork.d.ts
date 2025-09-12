import { Node } from './Node';
import { RenderLink } from './rendering/SVGRenderer';
import { NodeData, LinkData, EdgeData, GraphData, GraphConfig, Position, EventCallback, NodeCreationOptions, EdgeCreationOptions, DeletionOptions, BulkUpdateOptions, DataReplacementOptions, DataMergeOptions } from './types/index';
import { SelectionOptions, NodeStyles, EdgeStyles, StyleObject, ElementSelector, HighlightStyle, PathHighlightOptions, NeighborHighlightOptions, FocusOptions } from './types/styling';
/**
 * Graph initialization options
 */
export interface GraphNetworkOptions {
    /** Graph data containing nodes and links */
    data?: GraphData;
    /** Graph configuration */
    config?: Partial<GraphConfig>;
    /** Initial theme */
    theme?: 'light' | 'dark';
    /** Enable debug logging */
    debug?: boolean;
}
/**
 * Graph statistics and metrics
 */
export interface GraphStats {
    nodeCount: number;
    linkCount: number;
    visibleNodeCount: number;
    filteredNodeId: string | null;
    filterDepth: number;
    isAnimating: boolean;
    fps?: number;
    lastUpdateTime?: number;
}
/**
 * Tooltip configuration
 */
export interface TooltipConfig {
    enabled: boolean;
    showPosition: boolean;
    showType: boolean;
    customFields?: string[];
    formatter?: (node: Node) => string;
}
/**
 * Export format options
 */
export interface ExportOptions {
    format: 'json' | 'csv' | 'svg' | 'png';
    includeMetadata?: boolean;
    filename?: string;
}
/**
 * GraphNetwork - Modern modular interactive SVG graph visualization library
 *
 * Enhanced with full TypeScript support, comprehensive API, and modular architecture.
 * Orchestrates physics simulation, rendering, UI management, and user interactions.
 *
 * @example
 * ```typescript
 * const graph = new GraphNetwork<MyNodeType>('container-id', {
 *   data: { nodes: [...], links: [...] },
 *   config: {
 *     damping: 0.95,
 *     repulsionStrength: 6500,
 *     showControls: true
 *   }
 * });
 * ```
 */
export declare class GraphNetwork<T extends NodeData = NodeData> {
    private readonly containerId;
    private readonly container;
    private readonly config;
    private readonly nodes;
    private links;
    private readonly edges;
    private filteredNodes;
    private currentFilterNodeId;
    private currentTransaction;
    private transactionIdCounter;
    private animationFrame;
    private isAnimating;
    private lastFrameTime;
    private frameCount;
    private fps;
    private physics;
    private renderer;
    private ui;
    private events;
    private selectionManager;
    private styleManager;
    private highlightManager;
    private cameraController;
    private eventCallbacks;
    private readonly customEventListeners;
    private tooltip;
    private tooltipConfig;
    private readonly debug;
    private startTime;
    /**
     * Create a new GraphNetwork instance
     * @param containerId - DOM element ID to render the graph in
     * @param options - Configuration options
     */
    constructor(containerId: string, options?: GraphNetworkOptions);
    /**
     * Find and validate container element
     * @private
     */
    private findContainer;
    /**
     * Setup container with proper CSS classes and attributes
     * @private
     */
    private setupContainer;
    /**
     * Initialize all modular components
     * @private
     */
    private initializeModules;
    /**
     * Parse and validate input data
     * @private
     */
    private parseData;
    /**
     * Update physics configuration and notify physics engine
     * @param key - Configuration key
     * @param value - New value
     */
    updatePhysicsConfig(key: string, value: any): void;
    /**
     * Start animation loop
     */
    startAnimation(): void;
    /**
     * Stop animation loop
     */
    stopAnimation(): void;
    /**
     * Main animation loop - coordinates physics and rendering
     * @private
     */
    private animate;
    /**
     * Filter graph to show only specified node and its connections
     * @param nodeId - ID of the node to filter by
     * @param depth - Connection depth (defaults to config.filterDepth)
     */
    filterByNode(nodeId: string, depth?: number | null): void;
    /**
     * Reset filter to show all nodes
     */
    resetFilter(): void;
    /**
     * Update graph visibility based on current filter
     * @private
     */
    private updateGraphView;
    /**
     * Reset all node positions to random locations
     */
    resetAllNodePositions(): void;
    /**
     * Reset view and layout
     */
    resetViewAndLayout(): void;
    /**
     * Zoom in towards the center
     * @param factor - Zoom factor (defaults to config-based calculation)
     */
    zoomIn(factor?: number): void;
    /**
     * Zoom out from the center
     * @param factor - Zoom factor (defaults to config-based calculation)
     */
    zoomOut(factor?: number): void;
    /**
     * Zoom to fit all nodes in the viewport
     * @param padding - Padding around the content (default: 50px)
     */
    zoomToFit(padding?: number): void;
    /**
     * Toggle between light and dark themes
     */
    toggleTheme(): void;
    /**
     * Set theme
     * @param theme - Theme to set
     */
    setTheme(theme: 'light' | 'dark'): void;
    /**
     * Handle breadcrumb navigation
     * @private
     */
    private handleBreadcrumbAction;
    /**
     * Handle window resize
     * @private
     */
    private handleResize;
    /**
     * Create tooltip element
     * @private
     */
    private createTooltip;
    /**
     * Show tooltip for node
     * @param node - Node to show tooltip for
     * @param position - Screen position for tooltip
     */
    showTooltip(node: Node<T>, position?: Position | null): void;
    /**
     * Hide tooltip
     */
    hideTooltip(): void;
    /**
     * Configure tooltip behavior
     * @param config - Tooltip configuration
     */
    configureTooltip(config: Partial<TooltipConfig>): void;
    /**
     * Clear all graph data
     */
    clearGraph(): void;
    /**
     * Add a single node to the graph with enhanced validation and positioning options
     * @param nodeData - Node data to add
     * @param options - Creation options including initial position
     */
    addNode(nodeData: T, options?: NodeCreationOptions): Node<T>;
    /**
     * Delete a node from the graph with enhanced orphaned edge handling
     * @param nodeId - ID of the node to delete
     * @param options - Deletion options including animation and redraw control
     */
    deleteNode(nodeId: string, options?: DeletionOptions): boolean;
    /**
     * @deprecated Use deleteNode() instead
     * Legacy method for backward compatibility
     */
    removeNode(nodeId: string, redraw?: boolean): boolean;
    /**
     * Add an edge to the graph with enhanced validation and ID tracking
     * @param edgeData - Edge data with required ID
     * @param options - Creation options
     */
    addEdge(edgeData: EdgeData, options?: EdgeCreationOptions): RenderLink<T>;
    /**
     * Add a single link to the graph (backward compatibility)
     * @param linkData - Link data to add
     * @param redraw - Whether to redraw the graph (default: true)
     */
    addLink(linkData: LinkData, redraw?: boolean): RenderLink<T>;
    /**
     * Delete an edge from the graph by ID
     * @param edgeId - ID of the edge to delete
     * @param options - Deletion options
     */
    deleteEdge(edgeId: string, options?: DeletionOptions): boolean;
    /**
     * Remove a link from the graph by source and target (backward compatibility)
     * @param sourceId - Source node ID
     * @param targetId - Target node ID
     * @param redraw - Whether to redraw the graph (default: true)
     */
    removeLink(sourceId: string, targetId: string, redraw?: boolean): boolean;
    /**
     * Get all nodes as plain data objects
     * @returns Array of node data
     */
    getNodes(): T[];
    /**
     * Get all links as plain data objects
     * @returns Array of link data
     */
    getLinks(): LinkData[];
    /**
     * Get complete graph data
     * @returns Complete graph data with nodes and links
     */
    getData(): GraphData;
    /**
     * Get node by ID
     * @param nodeId - Node ID
     * @returns Node data or null if not found
     */
    getNode(nodeId: string): T | null;
    /**
     * Get edge by ID
     * @param edgeId - Edge ID
     * @returns Edge data or null if not found
     */
    getEdge(edgeId: string): LinkData | null;
    /**
     * Check if node exists
     * @param nodeId - Node ID
     * @returns True if node exists
     */
    hasNode(nodeId: string): boolean;
    /**
     * Check if edge exists
     * @param edgeId - Edge ID
     * @returns True if edge exists
     */
    hasEdge(edgeId: string): boolean;
    /**
     * Update an existing node's properties
     * @param nodeId - ID of the node to update
     * @param updates - Partial node data with updates
     * @param options - Update options
     */
    updateNode(nodeId: string, updates: Partial<Omit<T, 'id'>>, options?: {
        skipRedraw?: boolean;
    }): boolean;
    /**
     * Update an existing edge's properties
     * @param edgeId - ID of the edge to update
     * @param updates - Partial edge data with updates
     * @param options - Update options
     */
    updateEdge(edgeId: string, updates: Partial<Omit<EdgeData, 'id' | 'source' | 'target'>>, options?: {
        skipRedraw?: boolean;
    }): boolean;
    /**
     * Update multiple nodes in bulk with intelligent batching
     * @param nodesData - Array of node updates with IDs
     * @param options - Bulk update options
     * @returns Array of successfully updated node IDs
     */
    updateNodes(nodesData: Array<{
        id: string;
    } & Partial<Omit<T, 'id'>>>, options?: BulkUpdateOptions): string[];
    /**
     * Update multiple edges in bulk with intelligent batching
     * @param edgesData - Array of edge updates with IDs
     * @param options - Bulk update options
     * @returns Array of successfully updated edge IDs
     */
    updateEdges(edgesData: Array<{
        id: string;
    } & Partial<Omit<EdgeData, 'id' | 'source' | 'target'>>>, options?: BulkUpdateOptions): string[];
    /**
     * Enhanced setData with smooth transitions and position preservation
     * @param data - Graph data containing nodes and edges
     * @param options - Data replacement options with animation and layout control
     */
    setData(data: GraphData, options?: DataReplacementOptions): void;
    /**
     * Merge new data with existing graph data intelligently
     * @param data - Graph data to merge
     * @param options - Merge options with conflict resolution
     */
    mergeData(data: GraphData, options?: DataMergeOptions): void;
    /**
     * Clear all data from the graph with optional animation
     * @param options - Clear options with animation support
     */
    clearData(options?: {
        animate?: boolean;
        duration?: number;
    }): void;
    /**
     * Replace all data atomically - alias for setData for clarity
     * @param data - New graph data
     * @param options - Replacement options
     */
    replaceData(data: GraphData, options?: DataReplacementOptions): void;
    /**
     * Start a new transaction for atomic operations
     * @returns Transaction ID for tracking
     */
    startTransaction(): string;
    /**
     * Commit the current transaction, applying all changes
     * @returns Transaction summary
     */
    commitTransaction(): {
        id: string;
        operationCount: number;
        duration: number;
    };
    /**
     * Rollback the current transaction, undoing all changes
     * @returns Transaction summary
     */
    rollbackTransaction(): {
        id: string;
        operationCount: number;
        duration: number;
    };
    /**
     * Get current transaction status
     * @returns Transaction info or null if no active transaction
     */
    getTransactionStatus(): {
        id: string;
        startTime: number;
        operationCount: number;
        duration: number;
    } | null;
    /**
     * Check if currently in a transaction
     * @returns True if transaction is active
     */
    isInTransaction(): boolean;
    /**
     * Get internal node instance by ID (for advanced usage)
     * @param nodeId - Node ID
     * @returns Node instance or null if not found
     */
    getNodeInstance(nodeId: string): Node<T> | null;
    /**
     * Get graph statistics and metrics
     * @returns Graph statistics
     */
    getStats(): GraphStats;
    /**
     * Get current configuration
     * @returns Copy of current configuration
     */
    getConfig(): GraphConfig;
    /**
     * Update multiple configuration options
     * @param updates - Configuration updates
     */
    updateConfig(updates: Partial<GraphConfig>): void;
    /**
     * Export graph data in various formats
     * @param options - Export options
     * @returns Exported data or initiates download
     */
    export(options: ExportOptions): string | void;
    /**
     * Download data as a file
     * @private
     */
    private downloadFile;
    /**
     * Select a single node
     * @param nodeId - ID of node to select
     * @param options - Selection options
     * @returns True if selection changed
     */
    selectNode(nodeId: string, options?: SelectionOptions): boolean;
    /**
     * Select multiple nodes
     * @param nodeIds - Array of node IDs to select
     * @param options - Selection options
     * @returns Array of newly selected node IDs
     */
    selectNodes(nodeIds: string[], options?: SelectionOptions): string[];
    /**
     * Select a single edge
     * @param edgeId - ID of edge to select
     * @param options - Selection options
     * @returns True if selection changed
     */
    selectEdge(edgeId: string, options?: SelectionOptions): boolean;
    /**
     * Select multiple edges
     * @param edgeIds - Array of edge IDs to select
     * @param options - Selection options
     * @returns Array of newly selected edge IDs
     */
    selectEdges(edgeIds: string[], options?: SelectionOptions): string[];
    /**
     * Deselect a node
     * @param nodeId - ID of node to deselect
     * @returns True if deselection changed
     */
    deselectNode(nodeId: string): boolean;
    /**
     * Deselect an edge
     * @param edgeId - ID of edge to deselect
     * @returns True if deselection changed
     */
    deselectEdge(edgeId: string): boolean;
    /**
     * Clear all selections
     */
    deselectAll(): void;
    /**
     * Toggle node selection
     * @param nodeId - ID of node to toggle
     * @returns True if selection state changed
     */
    toggleNodeSelection(nodeId: string): boolean;
    /**
     * Toggle edge selection
     * @param edgeId - ID of edge to toggle
     * @returns True if selection state changed
     */
    toggleEdgeSelection(edgeId: string): boolean;
    /**
     * Check if node is selected
     * @param nodeId - ID of node to check
     * @returns True if node is selected
     */
    isNodeSelected(nodeId: string): boolean;
    /**
     * Check if edge is selected
     * @param edgeId - ID of edge to check
     * @returns True if edge is selected
     */
    isEdgeSelected(edgeId: string): boolean;
    /**
     * Get all selected node IDs
     * @returns Array of selected node IDs
     */
    getSelectedNodes(): string[];
    /**
     * Get all selected edge IDs
     * @returns Array of selected edge IDs
     */
    getSelectedEdges(): string[];
    /**
     * Set selection mode
     * @param mode - Selection mode
     */
    setSelectionMode(mode: 'single' | 'multi' | 'box'): void;
    /**
     * Get current selection mode
     * @returns Current selection mode
     */
    getSelectionMode(): 'single' | 'multi' | 'box';
    /**
     * Set style for a specific node
     * @param nodeId - ID of node to style
     * @param styles - Node styles to apply
     */
    setNodeStyle(nodeId: string, styles: NodeStyles): void;
    /**
     * Set style for a specific edge
     * @param edgeId - ID of edge to style
     * @param styles - Edge styles to apply
     */
    setEdgeStyle(edgeId: string, styles: EdgeStyles): void;
    /**
     * Update styles for multiple elements
     * @param elements - Element selector
     * @param styles - Styles to apply
     */
    updateStyles(elements: ElementSelector, styles: StyleObject): void;
    /**
     * Reset styles to defaults
     * @param elements - Elements to reset (optional, resets all if not provided)
     */
    resetStyle(elements?: ElementSelector): void;
    /**
     * Get current style for a node
     * @param nodeId - ID of node
     * @returns Node styles or null if not found
     */
    getNodeStyle(nodeId: string): NodeStyles | null;
    /**
     * Get current style for an edge
     * @param edgeId - ID of edge
     * @returns Edge styles or null if not found
     */
    getEdgeStyle(edgeId: string): EdgeStyles | null;
    /**
     * Highlight a single node
     * @param nodeId - ID of node to highlight
     * @param style - Highlight style options
     */
    highlightNode(nodeId: string, style?: HighlightStyle): void;
    /**
     * Highlight multiple nodes
     * @param nodeIds - Array of node IDs to highlight
     * @param style - Highlight style options
     */
    highlightNodes(nodeIds: string[], style?: HighlightStyle): void;
    /**
     * Highlight a single edge
     * @param edgeId - ID of edge to highlight
     * @param style - Highlight style options
     */
    highlightEdge(edgeId: string, style?: HighlightStyle): void;
    /**
     * Highlight multiple edges
     * @param edgeIds - Array of edge IDs to highlight
     * @param style - Highlight style options
     */
    highlightEdges(edgeIds: string[], style?: HighlightStyle): void;
    /**
     * Highlight shortest path between two nodes
     * @param sourceId - Source node ID
     * @param targetId - Target node ID
     * @param options - Path highlight options
     * @returns Array of highlighted element IDs or null if no path found
     */
    highlightPath(sourceId: string, targetId: string, options?: PathHighlightOptions): string[] | null;
    /**
     * Highlight neighbors of a node
     * @param nodeId - ID of node whose neighbors to highlight
     * @param options - Neighbor highlight options
     * @returns Array of highlighted element IDs
     */
    highlightNeighbors(nodeId: string, options?: NeighborHighlightOptions): string[];
    /**
     * Highlight all connections for a node
     * @param nodeId - ID of node whose connections to highlight
     * @param style - Highlight style options
     * @returns Array of highlighted element IDs
     */
    highlightConnections(nodeId: string, style?: HighlightStyle): string[];
    /**
     * Clear all highlights
     */
    clearHighlights(): void;
    /**
     * Clear highlight for a specific node
     * @param nodeId - ID of node to clear highlight
     */
    clearNodeHighlight(nodeId: string): void;
    /**
     * Clear highlight for a specific edge
     * @param edgeId - ID of edge to clear highlight
     */
    clearEdgeHighlight(edgeId: string): void;
    /**
     * Check if node is highlighted
     * @param nodeId - ID of node to check
     * @returns True if node is highlighted
     */
    isNodeHighlighted(nodeId: string): boolean;
    /**
     * Check if edge is highlighted
     * @param edgeId - ID of edge to check
     * @returns True if edge is highlighted
     */
    isEdgeHighlighted(edgeId: string): boolean;
    /**
     * Get all highlighted node IDs
     * @returns Array of highlighted node IDs
     */
    getHighlightedNodes(): string[];
    /**
     * Get all highlighted edge IDs
     * @returns Array of highlighted edge IDs
     */
    getHighlightedEdges(): string[];
    /**
     * Focus on a single node with smooth animation
     * @param nodeId - ID of node to focus on
     * @param options - Focus animation options
     * @returns Promise that resolves when animation completes
     */
    focusOnNode(nodeId: string, options?: FocusOptions): Promise<void>;
    /**
     * Focus on multiple nodes by fitting them in view
     * @param nodeIds - Array of node IDs to focus on
     * @param options - Focus animation options
     * @returns Promise that resolves when animation completes
     */
    focusOnNodes(nodeIds: string[], options?: FocusOptions): Promise<void>;
    /**
     * Fit entire graph to view with padding
     * @param padding - Padding around graph in pixels
     * @returns Promise that resolves when animation completes
     */
    fitToView(padding?: number): Promise<void>;
    /**
     * Center the view on the graph center
     * @returns Promise that resolves when animation completes
     */
    centerView(): Promise<void>;
    /**
     * Check if camera animation is currently running
     * @returns True if animation is active
     */
    isCameraAnimating(): boolean;
    /**
     * Stop current camera animation
     */
    stopCameraAnimation(): void;
    /**
     * Add event listener
     * @param event - Event name
     * @param callback - Event callback
     */
    on<K extends string>(event: K, callback: EventCallback<any>): void;
    /**
     * Remove event listener
     * @param event - Event name
     * @param callback - Event callback to remove
     */
    off<K extends string>(event: K, callback: EventCallback<any>): void;
    /**
     * Emit event to all listeners
     * @param event - Event name
     * @param data - Event data
     */
    emit<K extends string>(event: K, data?: any): void;
    /**
     * Convert this graph to a serializable object for debugging
     * @returns Object representation of the graph state
     */
    toObject(): {
        stats: GraphStats;
        config: GraphConfig;
        data: GraphData;
        modules: {
            physics: any;
            renderer: any;
            ui: any;
            events: any;
        };
        type: string;
        version: string;
    };
    /**
     * Clean up and destroy the graph
     */
    destroy(): void;
    /**
     * Create a string representation of the graph network
     * @returns String representation
     */
    toString(): string;
}
//# sourceMappingURL=GraphNetwork.d.ts.map