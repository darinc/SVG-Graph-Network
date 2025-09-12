import { Node } from '../Node';
import { Vector } from '../Vector';
import { NodeData, TransformState, InteractionConfig, Position } from '../types/index';
/**
 * Event callback signatures
 */
export interface EventManagerCallbacks<T extends NodeData = NodeData> {
    /** Get node elements for event binding */
    getNodeElements?: () => ReadonlyMap<Node<T>, any>;
    /** Fix node during dragging */
    fixNode?: (node: Node<T>) => void;
    /** Unfix node after dragging */
    unfixNode?: (node: Node<T>) => void;
    /** Filter by node */
    filterByNode?: (nodeId: string) => void;
    /** Reset filter */
    resetFilter?: () => void;
    /** Close settings panel */
    closeSettings?: () => void;
    /** Update transform state */
    updateTransform?: (x: number, y: number, scale: number) => void;
    /** Show tooltip */
    showTooltip?: (node: Node<T>, position: Position) => void;
    /** Hide tooltip */
    hideTooltip?: () => void;
    /** Handle resize */
    resize?: () => void;
}
/**
 * Event data for node interactions
 */
export interface NodeEvent<T extends NodeData = NodeData> {
    node: Node<T>;
    event?: MouseEvent | TouchEvent;
    position?: Position;
}
/**
 * Event data for background interactions
 */
export interface BackgroundEvent {
    event?: MouseEvent | TouchEvent;
    position?: Position;
}
/**
 * Event data for zoom interactions
 */
export interface ZoomEvent {
    scale: number;
    x: number;
    y: number;
    delta?: number;
    center?: Position;
}
/**
 * Event data for pan interactions
 */
export interface PanEvent {
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
}
/**
 * Event data for drag interactions
 */
export interface DragEvent<T extends NodeData = NodeData> {
    node: Node<T>;
    position: Position;
    startPosition: Position;
    delta: Vector;
}
/**
 * Union type of all event data
 */
export type EventData<T extends NodeData = NodeData> = NodeEvent<T> | BackgroundEvent | ZoomEvent | PanEvent | DragEvent<T> | {
    [key: string]: any;
};
/**
 * Event callback function signature
 */
export type EventCallback<T extends EventData = EventData> = (data: T) => void;
/**
 * EventManager - Handles all user interactions and event management
 * Enhanced with full TypeScript support and comprehensive interaction handling
 */
export declare class EventManager<T extends NodeData = NodeData> {
    private readonly config;
    private readonly eventCallbacks;
    private readonly interactionState;
    private transformState;
    private svg;
    private nodes;
    private callbacks;
    /**
     * Create a new EventManager instance
     * @param config - Interaction configuration
     */
    constructor(config?: Partial<InteractionConfig>);
    /**
     * Initialize event manager with required references
     * @param svg - SVG element to attach events to
     * @param nodes - Map of nodes for interaction
     * @param callbacks - Callback functions for various operations
     */
    initialize(svg: SVGSVGElement, nodes: Map<string, Node<T>>, callbacks?: EventManagerCallbacks<T>): void;
    /**
     * Setup all event listeners
     */
    private setupEventListeners;
    /**
     * Setup event listeners for node interactions
     */
    private setupNodeEventListeners;
    /**
     * Handle node mouse down (start dragging)
     */
    private handleNodeMouseDown;
    /**
     * Handle node double click (filtering)
     */
    private handleNodeDoubleClick;
    /**
     * Handle SVG mouse down (start panning)
     */
    private handleSvgMouseDown;
    /**
     * Handle SVG double click (reset filter)
     */
    private handleSvgDoubleClick;
    /**
     * Handle mouse move (dragging/panning)
     */
    private handleSvgMouseMove;
    /**
     * Handle node dragging
     */
    private handleNodeDrag;
    /**
     * Handle view panning
     */
    private handlePan;
    /**
     * Handle mouse up (stop dragging/panning)
     */
    private handleSvgMouseUp;
    /**
     * Handle mouse wheel (zooming)
     */
    private handleWheel;
    /**
     * Handle touch start
     */
    private handleTouchStart;
    /**
     * Handle node touch start
     */
    private handleNodeTouchStart;
    /**
     * Handle touch move
     */
    private handleTouchMove;
    /**
     * Handle touch node dragging
     */
    private handleTouchNodeDrag;
    /**
     * Handle touch panning
     */
    private handleTouchPan;
    /**
     * Handle pinch to zoom
     */
    private handleTouchPinch;
    /**
     * Handle touch end
     */
    private handleTouchEnd;
    /**
     * Handle double tap gesture
     */
    private handleDoubleTap;
    /**
     * Handle window resize
     */
    private handleResize;
    /**
     * Update transform state
     * @param x - X translation
     * @param y - Y translation
     * @param scale - Scale factor
     */
    setTransform(x: number, y: number, scale: number): void;
    /**
     * Get current transform state
     * @returns Copy of current transform state
     */
    getTransform(): TransformState;
    /**
     * Update configuration
     * @param newConfig - Partial configuration to merge
     */
    updateConfig(newConfig: Partial<InteractionConfig>): void;
    /**
     * Get current configuration
     * @returns Copy of current configuration
     */
    getConfig(): InteractionConfig;
    /**
     * Add event listener
     * @param event - Event name
     * @param callback - Event callback function
     */
    on<K extends string>(event: K, callback: EventCallback<EventData<T>>): void;
    /**
     * Remove event listener
     * @param event - Event name
     * @param callback - Event callback function to remove
     */
    off<K extends string>(event: K, callback: EventCallback<EventData<T>>): void;
    /**
     * Remove all event listeners for an event
     * @param event - Event name
     */
    removeAllListeners<K extends string>(event: K): void;
    /**
     * Emit event to all listeners
     * @param event - Event name
     * @param data - Event data
     */
    emit<K extends string>(event: K, data?: EventData<T>): void;
    /**
     * Get list of registered events
     * @returns Array of event names
     */
    getRegisteredEvents(): string[];
    /**
     * Check if currently dragging a node
     * @returns True if dragging
     */
    isDragging(): boolean;
    /**
     * Check if currently panning
     * @returns True if panning
     */
    isPanning(): boolean;
    /**
     * Check if currently pinching (zooming)
     * @returns True if pinching
     */
    isPinching(): boolean;
    /**
     * Get currently dragged node
     * @returns Node being dragged or null
     */
    getDraggedNode(): Node<T> | null;
    /**
     * Force stop all interactions
     */
    stopAllInteractions(): void;
    /**
     * Programmatically zoom to a specific scale and center
     * @param scale - Target scale
     * @param centerX - X center point (screen coordinates)
     * @param centerY - Y center point (screen coordinates)
     * @param animate - Whether to animate the zoom (not implemented)
     */
    zoomTo(scale: number, centerX?: number, centerY?: number, _animate?: boolean): void;
    /**
     * Programmatically pan to a specific position
     * @param x - Target X position
     * @param y - Target Y position
     * @param animate - Whether to animate the pan (not implemented)
     */
    panTo(x: number, y: number, _animate?: boolean): void;
    /**
     * Convert screen coordinates to SVG coordinates
     * @param screenX - Screen X coordinate
     * @param screenY - Screen Y coordinate
     * @returns SVG coordinates
     */
    screenToSVG(screenX: number, screenY: number): Vector;
    /**
     * Convert SVG coordinates to screen coordinates
     * @param svgX - SVG X coordinate
     * @param svgY - SVG Y coordinate
     * @returns Screen coordinates
     */
    svgToScreen(svgX: number, svgY: number): Vector;
    /**
     * Update callbacks
     * @param newCallbacks - New callbacks to merge
     */
    updateCallbacks(newCallbacks: Partial<EventManagerCallbacks<T>>): void;
    /**
     * Convert this event manager to a serializable object for debugging
     * @returns Object representation of the event manager state
     */
    toObject(): {
        config: InteractionConfig;
        transformState: TransformState;
        interactionState: {
            isDragging: boolean;
            isPanning: boolean;
            isPinching: boolean;
            dragNodeId: string | null;
        };
        registeredEvents: string[];
        type: string;
        version: string;
    };
    /**
     * Clean up event listeners and references
     */
    destroy(): void;
    /**
     * Create a string representation of the event manager
     * @returns String representation
     */
    toString(): string;
}
//# sourceMappingURL=EventManager.d.ts.map