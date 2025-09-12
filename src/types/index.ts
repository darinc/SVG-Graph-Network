/**
 * Core type definitions for SVG Graph Network library
 */

// ==================== Core Data Types ====================

/**
 * Base node data structure that all nodes must implement
 */
export interface NodeData {
    /** Unique identifier for the node */
    id: string;
    /** Display name for the node */
    name: string;
    /** Node type for styling and grouping */
    type?: string;
    /** Visual shape of the node */
    shape?: 'circle' | 'rectangle' | 'square' | 'triangle';
    /** Size of the node in pixels */
    size?: number;
    /** Allow additional custom properties */
    [key: string]: any;
}

/**
 * Link/edge data structure connecting two nodes
 */
export interface LinkData {
    /** Unique identifier for the edge (optional for backward compatibility) */
    id?: string;
    /** Source node ID */
    source: string;
    /** Target node ID */
    target: string;
    /** Optional label for the link */
    label?: string;
    /** Weight/strength of the connection */
    weight?: number;
    /** Visual style of the line */
    line_type?: 'solid' | 'dashed' | 'dotted';
    /** Color of the edge */
    color?: string;
    /** Allow additional custom properties */
    [key: string]: any;
}

/**
 * Complete graph data structure
 */
export interface GraphData {
    /** Array of node data */
    nodes: NodeData[];
    /** Array of link data */
    links: LinkData[];
}

// ==================== Configuration Types ====================

/**
 * Physics simulation configuration
 */
export interface PhysicsConfig {
    /** Velocity damping factor (0-1) */
    damping: number;
    /** Node repulsion force strength */
    repulsionStrength: number;
    /** Link attraction force strength */
    attractionStrength: number;
    /** Same-type node grouping force */
    groupingStrength: number;
}

/**
 * UI and display configuration
 */
export interface UIConfig {
    /** Show control buttons */
    showControls: boolean;
    /** Show legend panel */
    showLegend: boolean;
    /** Show title */
    showTitle: boolean;
    /** Show breadcrumb navigation */
    showBreadcrumbs: boolean;
    /** Visual theme */
    theme: 'light' | 'dark';
    /** Graph title */
    title: string;
}

/**
 * Interaction configuration
 */
export interface InteractionConfig {
    /** Mouse wheel zoom sensitivity */
    zoomSensitivity: number;
    /** Connection depth for filtering */
    filterDepth: number;
}

/**
 * Complete graph configuration combining all aspects
 */
export interface GraphConfig extends PhysicsConfig, UIConfig, InteractionConfig {
    /** Allow additional configuration properties */
    [key: string]: any;
}

// ==================== Runtime Types ====================

/**
 * 2D position coordinates
 */
export interface Position {
    x: number;
    y: number;
}

/**
 * Transform state for pan/zoom operations
 */
export interface TransformState {
    x: number;
    y: number;
    scale: number;
}

/**
 * Bounding box/rectangle
 */
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

// ==================== Event Types ====================

/**
 * Base event interface
 */
export interface BaseEvent {
    /** Event type identifier */
    type: string;
    /** Event timestamp */
    timestamp?: number;
}

/**
 * Node-related events
 */
export interface NodeEvent extends BaseEvent {
    type: 'nodeAdded' | 'nodeRemoved' | 'nodeUpdated' | 'nodeClicked' | 'nodeHover';
    nodeId: string;
    nodeData?: NodeData;
}

/**
 * Link-related events
 */
export interface LinkEvent extends BaseEvent {
    type: 'linkAdded' | 'linkRemoved' | 'linkUpdated';
    linkData: LinkData;
}

/**
 * View-related events
 */
export interface ViewEvent extends BaseEvent {
    type: 'zoom' | 'pan' | 'reset' | 'resize';
    transform?: TransformState;
    bounds?: Bounds;
}

/**
 * Filter-related events
 */
export interface FilterEvent extends BaseEvent {
    type: 'filtered' | 'filterReset';
    nodeId?: string;
    depth?: number;
    visibleNodes?: string[];
}

/**
 * Data-related events
 */
export interface DataEvent extends BaseEvent {
    type: 'dataLoaded' | 'dataCleared';
    nodeCount?: number;
    linkCount?: number;
}

/**
 * Theme-related events
 */
export interface ThemeEvent extends BaseEvent {
    type: 'themeChanged';
    theme: 'light' | 'dark';
}

/**
 * Union type of all possible events
 */
export type GraphEvent = NodeEvent | LinkEvent | ViewEvent | FilterEvent | DataEvent | ThemeEvent;

// ==================== Callback Types ====================

/**
 * Event callback function signature
 */
export type EventCallback<T extends GraphEvent = GraphEvent> = (event: T) => void;

/**
 * Generic callback function
 */
export type Callback<T = void> = () => T;

/**
 * Callback with single parameter
 */
export type ParameterCallback<P, T = void> = (param: P) => T;

// ==================== Utility Types ====================

/**
 * Make all properties optional
 */
export type Partial<T> = {
    [P in keyof T]?: T[P];
};

/**
 * Extract specific event types
 */
export type EventType<T extends GraphEvent['type']> = Extract<GraphEvent, { type: T }>;

/**
 * Configuration update type - partial config with known keys
 */
export type ConfigUpdate = Partial<GraphConfig>;

/**
 * Node update type - partial node data but ID is required
 */
export type NodeUpdate = { id: string } & Partial<Omit<NodeData, 'id'>>;

/**
 * Link update type - ID required for identification, other fields optional
 */
export type LinkUpdate = { id: string } & Partial<Omit<LinkData, 'id'>>;

/**
 * Edge data for creation - enhanced with validation requirements
 */
export interface EdgeData extends Omit<LinkData, 'id'> {
    /** Unique identifier for the edge */
    id: string;
    /** Source node ID */
    source: string;
    /** Target node ID */
    target: string;
}

/**
 * Node creation options with optional positioning
 */
export interface NodeCreationOptions {
    /** Initial X position (optional) */
    x?: number;
    /** Initial Y position (optional) */
    y?: number;
    /** Skip validation (for internal use) */
    skipValidation?: boolean;
    /** Skip redraw after creation */
    skipRedraw?: boolean;
}

/**
 * Edge creation options
 */
export interface EdgeCreationOptions {
    /** Skip validation (for internal use) */
    skipValidation?: boolean;
    /** Skip redraw after creation */
    skipRedraw?: boolean;
}

/**
 * Deletion options
 */
export interface DeletionOptions {
    /** Skip redraw after deletion */
    skipRedraw?: boolean;
    /** For edge deletion: also remove orphaned nodes */
    removeOrphans?: boolean;
    /** Animate the deletion */
    animate?: boolean;
}

/**
 * Bulk update options for nodes
 */
export interface BulkUpdateOptions {
    /** Skip redraw until all updates complete */
    skipRedraw?: boolean;
    /** Skip validation for performance (use with caution) */
    skipValidation?: boolean;
    /** Animate the updates */
    animate?: boolean;
    /** Animation duration in milliseconds */
    duration?: number;
}

/**
 * Data replacement options with transitions
 */
export interface DataReplacementOptions {
    /** Animate the transition */
    animate?: boolean;
    /** Animation duration in milliseconds */
    duration?: number;
    /** Preserve existing node positions */
    preservePositions?: boolean;
    /** Layout to apply after data replacement */
    layout?: 'force-directed' | 'preserve' | 'reset';
    /** Skip validation for performance */
    skipValidation?: boolean;
}

/**
 * Data merging options
 */
export interface DataMergeOptions {
    /** How to handle conflicts for existing nodes */
    nodeConflictResolution?: 'update' | 'preserve' | 'error';
    /** How to handle conflicts for existing edges */
    edgeConflictResolution?: 'update' | 'preserve' | 'error';
    /** Skip redraw until merge complete */
    skipRedraw?: boolean;
    /** Animate the merge operation */
    animate?: boolean;
    /** Animation duration in milliseconds */
    duration?: number;
}

/**
 * Transaction state for atomic operations
 */
export interface TransactionState {
    /** Transaction ID */
    id: string;
    /** Transaction start timestamp */
    startTime: number;
    /** Operations performed in this transaction */
    operations: TransactionOperation[];
    /** Snapshot of data before transaction */
    beforeSnapshot: GraphData;
}

/**
 * Transaction operation record
 */
export interface TransactionOperation {
    /** Operation type */
    type: 'addNode' | 'deleteNode' | 'updateNode' | 'addEdge' | 'deleteEdge' | 'updateEdge';
    /** Target ID */
    targetId: string;
    /** Operation timestamp */
    timestamp: number;
    /** Before state (for rollback) */
    beforeState?: unknown;
    /** After state */
    afterState?: unknown;
}

// ==================== Module-Specific Types ====================

/**
 * SVG element references used by renderer
 */
export interface SVGElements {
    svg: SVGSVGElement;
    transformGroup: SVGGElement;
    linkGroup: SVGGElement;
    nodeGroup: SVGGElement;
    labelGroup: SVGGElement;
}

/**
 * UI element references
 */
export interface UIElements {
    container: HTMLElement;
    titleElement?: HTMLElement;
    legendElement?: HTMLElement;
    controls?: HTMLElement;
    settingsPanel?: HTMLElement;
}

/**
 * Physics simulation state
 */
export interface SimulationState {
    isRunning: boolean;
    temperature: number;
    iteration: number;
}

// ==================== Type Guards ====================

/**
 * Type guard to check if data is valid NodeData
 */
export function isNodeData(data: any): data is NodeData {
    return (
        data &&
        typeof data === 'object' &&
        typeof data.id === 'string' &&
        typeof data.name === 'string'
    );
}

/**
 * Type guard to check if data is valid LinkData
 */
export function isLinkData(data: any): data is LinkData {
    return (
        data &&
        typeof data === 'object' &&
        typeof data.source === 'string' &&
        typeof data.target === 'string'
    );
}

/**
 * Type guard to check if data is valid GraphData
 */
export function isGraphData(data: any): data is GraphData {
    return (
        data &&
        typeof data === 'object' &&
        Array.isArray(data.nodes) &&
        Array.isArray(data.links) &&
        data.nodes.every(isNodeData) &&
        data.links.every(isLinkData)
    );
}

// ==================== Constants ====================

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: GraphConfig = {
    // Physics
    damping: 0.95,
    repulsionStrength: 6500,
    attractionStrength: 0.001,
    groupingStrength: 0.001,

    // Interaction
    zoomSensitivity: 1.01,
    filterDepth: 1,

    // UI
    showControls: true,
    showLegend: true,
    showTitle: true,
    showBreadcrumbs: true,
    theme: 'dark',
    title: 'Graph Network'
};

/**
 * Supported node shapes
 */
export const NODE_SHAPES = ['circle', 'rectangle', 'square', 'triangle'] as const;

/**
 * Supported line types
 */
export const LINE_TYPES = ['solid', 'dashed', 'dotted'] as const;

/**
 * Supported themes
 */
export const THEMES = ['light', 'dark'] as const;
