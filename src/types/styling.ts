/**
 * Type definitions for Phase 5: Styling & Interactivity APIs
 */

import { Position } from './index';

// ==================== Visual States ====================

/**
 * Available visual states for elements
 */
export type VisualState = 'normal' | 'hover' | 'active' | 'disabled' | 'highlighted' | 'selected';

// ==================== Style Objects ====================

/**
 * Node styling properties
 */
export interface NodeStyles {
    /** Fill color */
    fill?: string;
    /** Stroke color */
    stroke?: string;
    /** Stroke width in pixels */
    strokeWidth?: number;
    /** Element opacity (0-1) */
    opacity?: number;
    /** Node size in pixels */
    size?: number;
    /** Node shape */
    shape?: 'circle' | 'rectangle' | 'square' | 'triangle';
    /** Additional CSS class names */
    className?: string;
    /** CSS filter effects */
    filter?: string;
}

/**
 * Edge styling properties
 */
export interface EdgeStyles {
    /** Stroke color */
    stroke?: string;
    /** Stroke width in pixels */
    strokeWidth?: number;
    /** Stroke dash pattern */
    strokeDasharray?: string;
    /** Element opacity (0-1) */
    opacity?: number;
    /** Arrow marker for edge end */
    markerEnd?: string;
    /** Additional CSS class names */
    className?: string;
    /** CSS filter effects */
    filter?: string;
}

/**
 * Generic style object that can be applied to any element
 */
export interface StyleObject extends NodeStyles, EdgeStyles {
    /** Any additional CSS properties */
    [cssProperty: string]: any;
}

// ==================== Selection ====================

/**
 * Element selector types
 */
export type ElementSelector = string | string[] | 'all' | 'selected' | 'highlighted';

/**
 * Selection configuration options
 */
export interface SelectionOptions {
    /** Whether to add to existing selection or replace it */
    additive?: boolean;
    /** Color for selection highlight */
    highlightColor?: string;
    /** Stroke width for selection */
    strokeWidth?: number;
    /** Whether to emit selection events */
    silent?: boolean;
    /** Animation duration for selection feedback */
    animationDuration?: number;
}

/**
 * Selection state information
 */
export interface SelectionState {
    /** Currently selected node IDs */
    selectedNodes: Set<string>;
    /** Currently selected edge IDs */
    selectedEdges: Set<string>;
    /** Last selected element for shift-selection */
    lastSelected?: string;
    /** Selection mode */
    mode: 'single' | 'multi' | 'box';
}

// ==================== Highlighting ====================

/**
 * Highlight styling options
 */
export interface HighlightStyle {
    /** Highlight color */
    color?: string;
    /** Stroke width for highlights */
    strokeWidth?: number;
    /** Highlight opacity */
    opacity?: number;
    /** Whether highlight should be animated */
    animated?: boolean;
    /** Add glow effect */
    glow?: boolean;
    /** Add pulse effect */
    pulse?: boolean;
    /** Animation duration */
    duration?: number;
    /** Z-index for layering */
    zIndex?: number;
}

/**
 * Path highlighting options
 */
export interface PathHighlightOptions extends HighlightStyle {
    /** Color for the path */
    pathColor?: string;
    /** Width of the path line */
    pathWidth?: number;
    /** Whether to show flow animation along path */
    showFlow?: boolean;
    /** Speed of flow animation */
    flowSpeed?: number;
    /** Show direction indicators */
    showDirection?: boolean;
}

/**
 * Neighbor highlighting options
 */
export interface NeighborHighlightOptions extends HighlightStyle {
    /** Maximum depth to highlight */
    depth?: number;
    /** Different colors for different depths */
    depthColors?: string[];
    /** Whether to fade nodes by distance */
    fadeByDistance?: boolean;
    /** Include edge highlighting */
    highlightEdges?: boolean;
}

// ==================== Focus & Camera ====================

/**
 * Focus animation options
 */
export interface FocusOptions {
    /** Target zoom level */
    scale?: number;
    /** Animation duration in milliseconds */
    duration?: number;
    /** Offset from center */
    offset?: Position;
    /** Padding around target in pixels */
    padding?: number;
    /** Animation easing function */
    easing?: EasingFunction;
    /** Whether to animate the transition */
    animated?: boolean;
}

/**
 * Available easing functions for animations
 */
export type EasingFunction = 
    | 'linear'
    | 'ease'
    | 'ease-in'
    | 'ease-out' 
    | 'ease-in-out'
    | 'cubic-bezier';

/**
 * View bounds information
 */
export interface ViewBounds {
    /** Minimum X coordinate */
    minX: number;
    /** Maximum X coordinate */
    maxX: number;
    /** Minimum Y coordinate */
    minY: number;
    /** Maximum Y coordinate */
    maxY: number;
    /** Width of the view */
    width: number;
    /** Height of the view */
    height: number;
    /** Center point */
    center: Position;
}

/**
 * Animation state for smooth transitions
 */
export interface AnimationState {
    /** Animation is currently running */
    active: boolean;
    /** Animation start time */
    startTime: number;
    /** Animation duration */
    duration: number;
    /** Starting values */
    from: {
        x: number;
        y: number;
        scale: number;
    };
    /** Target values */
    to: {
        x: number;
        y: number;
        scale: number;
    };
    /** Easing function */
    easing: EasingFunction;
    /** Animation completion callback */
    onComplete?: () => void;
}

// ==================== Event Types ====================

/**
 * Selection change event data
 */
export interface SelectionEvent {
    type: 'selectionChanged';
    selectedNodes: string[];
    selectedEdges: string[];
    addedNodes: string[];
    removedNodes: string[];
    addedEdges: string[];
    removedEdges: string[];
    timestamp: number;
}

/**
 * Highlight change event data
 */
export interface HighlightEvent {
    type: 'highlightChanged';
    highlightedNodes: string[];
    highlightedEdges: string[];
    style: HighlightStyle;
    timestamp: number;
}

/**
 * Focus change event data
 */
export interface FocusEvent {
    type: 'focusChanged';
    targetNodes: string[];
    transform: {
        x: number;
        y: number;
        scale: number;
    };
    options: FocusOptions;
    timestamp: number;
}

/**
 * Style change event data
 */
export interface StyleEvent {
    type: 'styleChanged';
    elements: string[];
    elementType: 'node' | 'edge';
    styles: StyleObject;
    timestamp: number;
}

/**
 * Visual state change event data
 */
export interface StateEvent {
    type: 'stateChanged';
    elementId: string;
    elementType: 'node' | 'edge';
    oldState: VisualState;
    newState: VisualState;
    timestamp: number;
}

// ==================== Manager Interfaces ====================

/**
 * Selection manager interface
 */
export interface ISelectionManager {
    selectNode(nodeId: string, options?: SelectionOptions): boolean;
    selectNodes(nodeIds: string[], options?: SelectionOptions): string[];
    selectEdge(edgeId: string, options?: SelectionOptions): boolean;
    selectEdges(edgeIds: string[], options?: SelectionOptions): string[];
    deselectNode(nodeId: string): boolean;
    deselectEdge(edgeId: string): boolean;
    deselectAll(): void;
    toggleNodeSelection(nodeId: string): boolean;
    toggleEdgeSelection(edgeId: string): boolean;
    isNodeSelected(nodeId: string): boolean;
    isEdgeSelected(edgeId: string): boolean;
    getSelectedNodes(): string[];
    getSelectedEdges(): string[];
    getSelectionState(): SelectionState;
    clearSelection(): void;
}

/**
 * Style manager interface
 */
export interface IStyleManager {
    setNodeStyle(nodeId: string, styles: NodeStyles): void;
    setEdgeStyle(edgeId: string, styles: EdgeStyles): void;
    setNodeState(nodeId: string, state: VisualState): void;
    setEdgeState(edgeId: string, state: VisualState): void;
    updateStyles(elements: ElementSelector, styles: StyleObject): void;
    resetStyle(elements?: ElementSelector): void;
    getNodeStyle(nodeId: string): NodeStyles | null;
    getEdgeStyle(edgeId: string): EdgeStyles | null;
    getNodeState(nodeId: string): VisualState;
    getEdgeState(edgeId: string): VisualState;
    clearStyles(): void;
}

/**
 * Highlight manager interface  
 */
export interface IHighlightManager {
    highlightNode(nodeId: string, style?: HighlightStyle): void;
    highlightNodes(nodeIds: string[], style?: HighlightStyle): void;
    highlightEdge(edgeId: string, style?: HighlightStyle): void;
    highlightEdges(edgeIds: string[], style?: HighlightStyle): void;
    highlightPath(sourceId: string, targetId: string, options?: PathHighlightOptions): string[] | null;
    highlightNeighbors(nodeId: string, options?: NeighborHighlightOptions): string[];
    highlightConnections(nodeId: string, style?: HighlightStyle): string[];
    clearHighlights(): void;
    clearNodeHighlight(nodeId: string): void;
    clearEdgeHighlight(edgeId: string): void;
    isNodeHighlighted(nodeId: string): boolean;
    isEdgeHighlighted(edgeId: string): boolean;
    getHighlightedNodes(): string[];
    getHighlightedEdges(): string[];
}

/**
 * Camera controller interface
 */
export interface ICameraController {
    focusOnNode(nodeId: string, options?: FocusOptions): Promise<void>;
    focusOnNodes(nodeIds: string[], options?: FocusOptions): Promise<void>;
    fitToView(padding?: number): Promise<void>;
    centerView(): Promise<void>;
    getViewBounds(): ViewBounds;
    isAnimating(): boolean;
    stopAnimation(): void;
    setTransform(x: number, y: number, scale: number, animated?: boolean): Promise<void>;
}