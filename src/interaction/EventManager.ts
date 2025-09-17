import { Node } from '../Node';
import { Vector } from '../Vector';
import { NodeData, TransformState, InteractionConfig, Position } from '../types/index';
import { createLogger } from '../utils/Logger';

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
 * Touch target information
 */
interface TouchTarget<T extends NodeData = NodeData> {
    type: 'node' | 'background';
    node?: Node<T>;
    element?: Element;
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
export type EventData<T extends NodeData = NodeData> =
    | NodeEvent<T>
    | BackgroundEvent
    | ZoomEvent
    | PanEvent
    | DragEvent<T>
    | { [key: string]: any };

/**
 * Event callback function signature
 */
export type EventCallback<T extends EventData = EventData> = (data: T) => void;

/**
 * Interaction state tracking
 */
interface InteractionState<T extends NodeData = NodeData> {
    isDragging: boolean;
    isPanning: boolean;
    isPinching: boolean;
    dragNode: Node<T> | null;
    wasNodeFixed: boolean;

    // Mouse state
    lastMouseX: number;
    lastMouseY: number;

    // Touch state
    lastTouchTime: number;
    touchStartTime: number;
    lastTouchEndTime: number;
    touchTarget: TouchTarget<T> | null;
    dragStartPosition: Position | null;

    // Pinch state
    lastPinchDistance: number;
    lastPinchCenterX: number;
    lastPinchCenterY: number;
    lastTouchX: number;
    lastTouchY: number;
}

/**
 * EventManager - Handles all user interactions and event management
 * Enhanced with full TypeScript support and comprehensive interaction handling
 */
export class EventManager<T extends NodeData = NodeData> {
    private readonly config: InteractionConfig;
    private readonly eventCallbacks = new Map<string, EventCallback[]>();
    private readonly interactionState: InteractionState<T>;
    private transformState: TransformState;
    private readonly logger = createLogger('EventManager');

    // References (set during initialization)
    private svg: SVGSVGElement | null = null;
    private nodes: Map<string, Node<T>> | null = null;
    private callbacks: EventManagerCallbacks<T> = {};

    /**
     * Create a new EventManager instance
     * @param config - Interaction configuration
     */
    constructor(config: Partial<InteractionConfig> = {}) {
        this.config = {
            zoomSensitivity: 1.01,
            filterDepth: 1,
            ...config
        };

        this.interactionState = {
            isDragging: false,
            isPanning: false,
            isPinching: false,
            dragNode: null,
            wasNodeFixed: false,

            lastMouseX: 0,
            lastMouseY: 0,

            lastTouchTime: 0,
            touchStartTime: 0,
            lastTouchEndTime: 0,
            touchTarget: null,
            dragStartPosition: null,

            lastPinchDistance: 0,
            lastPinchCenterX: 0,
            lastPinchCenterY: 0,
            lastTouchX: 0,
            lastTouchY: 0
        };

        this.transformState = {
            x: 0,
            y: 0,
            scale: 1
        };
    }

    /**
     * Initialize event manager with required references
     * @param svg - SVG element to attach events to
     * @param nodes - Map of nodes for interaction
     * @param callbacks - Callback functions for various operations
     */
    initialize(
        svg: SVGSVGElement,
        nodes: Map<string, Node<T>>,
        callbacks: EventManagerCallbacks<T> = {}
    ): void {
        this.svg = svg;
        this.nodes = nodes;
        this.callbacks = callbacks;
        this.setupEventListeners();
    }

    /**
     * Setup all event listeners
     */
    private setupEventListeners(): void {
        if (!this.svg) return;

        // Setup node event listeners
        this.setupNodeEventListeners();

        // SVG-level events
        this.svg.addEventListener('mousedown', e => this.handleSvgMouseDown(e));
        this.svg.addEventListener('mousemove', e => this.handleSvgMouseMove(e));
        this.svg.addEventListener('mouseup', () => this.handleSvgMouseUp());
        this.svg.addEventListener('dblclick', e => this.handleSvgDoubleClick(e));
        this.svg.addEventListener('wheel', e => this.handleWheel(e));

        // Touch events
        this.svg.addEventListener('touchstart', e => this.handleTouchStart(e), { passive: false });
        this.svg.addEventListener('touchmove', e => this.handleTouchMove(e), { passive: false });
        this.svg.addEventListener('touchend', e => this.handleTouchEnd(e), { passive: false });
        this.svg.addEventListener('touchcancel', e => this.handleTouchEnd(e), { passive: false });

        // Window events
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Setup event listeners for node interactions
     */
    private setupNodeEventListeners(): void {
        if (!this.nodes || !this.callbacks.getNodeElements) return;

        const nodeElements = this.callbacks.getNodeElements();

        this.nodes.forEach(node => {
            const elements = nodeElements.get(node);
            if (!elements) return;

            // Mouse events
            elements.group.addEventListener('mousedown', (e: MouseEvent) => {
                this.handleNodeMouseDown(e, node);
            });

            elements.group.addEventListener('dblclick', (e: MouseEvent) => {
                this.handleNodeDoubleClick(e, node);
            });

            // Touch events for nodes
            elements.group.addEventListener('touchstart', (e: TouchEvent) => {
                this.handleNodeTouchStart(e, node);
            });
        });
    }

    /**
     * Handle node mouse down (start dragging)
     */
    private handleNodeMouseDown(e: MouseEvent, node: Node<T>): void {
        e.preventDefault();

        this.interactionState.isDragging = true;
        this.interactionState.dragNode = node;
        this.interactionState.wasNodeFixed = node.isFixed;

        this.callbacks.fixNode?.(node);

        this.emit('nodeMouseDown', {
            node,
            event: e,
            position: { x: e.clientX, y: e.clientY }
        } as NodeEvent<T>);
    }

    /**
     * Handle node double click (filtering)
     */
    private handleNodeDoubleClick(e: MouseEvent, node: Node<T>): void {
        e.preventDefault();
        e.stopPropagation();

        this.callbacks.filterByNode?.(node.getId());

        this.emit('nodeDoubleClick', {
            node,
            event: e,
            position: { x: e.clientX, y: e.clientY }
        } as NodeEvent<T>);
    }

    /**
     * Handle SVG mouse down (start panning)
     */
    private handleSvgMouseDown(e: MouseEvent): void {
        if (this.interactionState.isDragging) return;

        // Close settings panel if it's open (when clicking background)
        this.callbacks.closeSettings?.();

        this.interactionState.isPanning = true;
        this.interactionState.lastMouseX = e.clientX;
        this.interactionState.lastMouseY = e.clientY;
    }

    /**
     * Handle SVG double click (reset filter)
     */
    private handleSvgDoubleClick(e: MouseEvent): void {
        e.preventDefault();

        this.callbacks.resetFilter?.();

        this.emit('backgroundDoubleClick', {
            event: e,
            position: { x: e.clientX, y: e.clientY }
        } as BackgroundEvent);
    }

    /**
     * Handle mouse move (dragging/panning)
     */
    private handleSvgMouseMove(e: MouseEvent): void {
        if (this.interactionState.isDragging && this.interactionState.dragNode) {
            this.handleNodeDrag(e);
        } else if (this.interactionState.isPanning) {
            this.handlePan(e);
        }
    }

    /**
     * Handle node dragging
     */
    private handleNodeDrag(e: MouseEvent): void {
        if (!this.svg || !this.interactionState.dragNode) return;

        const rect = this.svg.getBoundingClientRect();
        const newX = (e.clientX - rect.left - this.transformState.x) / this.transformState.scale;
        const newY = (e.clientY - rect.top - this.transformState.y) / this.transformState.scale;

        const oldPosition = this.interactionState.dragNode.position.clone();
        this.interactionState.dragNode.position.x = newX;
        this.interactionState.dragNode.position.y = newY;

        this.callbacks.showTooltip?.(this.interactionState.dragNode, {
            x: e.clientX + 10,
            y: e.clientY + 10
        });

        this.emit('nodeDrag', {
            node: this.interactionState.dragNode,
            position: { x: newX, y: newY },
            startPosition: this.interactionState.dragStartPosition || {
                x: oldPosition.x,
                y: oldPosition.y
            },
            delta: new Vector(newX - oldPosition.x, newY - oldPosition.y)
        } as DragEvent<T>);
    }

    /**
     * Handle view panning
     */
    private handlePan(e: MouseEvent): void {
        const deltaX = e.clientX - this.interactionState.lastMouseX;
        const deltaY = e.clientY - this.interactionState.lastMouseY;

        this.transformState.x += deltaX;
        this.transformState.y += deltaY;

        this.callbacks.updateTransform?.(
            this.transformState.x,
            this.transformState.y,
            this.transformState.scale
        );

        this.interactionState.lastMouseX = e.clientX;
        this.interactionState.lastMouseY = e.clientY;

        this.emit('pan', {
            x: this.transformState.x,
            y: this.transformState.y,
            deltaX,
            deltaY
        } as PanEvent);
    }

    /**
     * Handle mouse up (stop dragging/panning)
     */
    private handleSvgMouseUp(): void {
        if (this.interactionState.isDragging && this.interactionState.dragNode) {
            // Restore node's original fixed state
            if (!this.interactionState.wasNodeFixed) {
                this.callbacks.unfixNode?.(this.interactionState.dragNode);
            }
        }

        this.interactionState.isDragging = false;
        this.interactionState.dragNode = null;
        this.interactionState.isPanning = false;
        this.interactionState.wasNodeFixed = false;
        this.interactionState.dragStartPosition = null;

        this.callbacks.hideTooltip?.();
    }

    /**
     * Handle mouse wheel (zooming)
     */
    private handleWheel(e: WheelEvent): void {
        e.preventDefault();

        if (!this.svg) return;

        const rect = this.svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomDelta =
            e.deltaY > 0 ? 1 / this.config.zoomSensitivity : this.config.zoomSensitivity;
        const newScale = Math.max(0.2, Math.min(2.0, this.transformState.scale * zoomDelta));

        // Zoom towards mouse position
        const scaleChange = newScale / this.transformState.scale;
        this.transformState.x = mouseX - (mouseX - this.transformState.x) * scaleChange;
        this.transformState.y = mouseY - (mouseY - this.transformState.y) * scaleChange;
        this.transformState.scale = newScale;

        this.callbacks.updateTransform?.(
            this.transformState.x,
            this.transformState.y,
            this.transformState.scale
        );

        this.emit('zoom', {
            scale: this.transformState.scale,
            x: this.transformState.x,
            y: this.transformState.y,
            delta: zoomDelta,
            center: { x: mouseX, y: mouseY }
        } as ZoomEvent);
    }

    /**
     * Handle touch start
     */
    private handleTouchStart(e: TouchEvent): void {
        e.preventDefault();

        this.interactionState.touchStartTime = Date.now();
        const touches = e.touches;

        if (touches.length === 1) {
            // Single touch - could be pan or drag
            const touch = touches[0];
            this.interactionState.lastTouchX = touch.clientX;
            this.interactionState.lastTouchY = touch.clientY;

            // Check if touching a node
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            const nodeGroup = target?.closest('g[data-id]');

            if (nodeGroup) {
                const nodeId = nodeGroup.getAttribute('data-id');
                const node = this.nodes?.get(nodeId || '');

                if (node) {
                    this.interactionState.touchTarget = { type: 'node', node, element: nodeGroup };
                }
            } else {
                // Close settings panel if it's open (when touching background)
                this.callbacks.closeSettings?.();

                this.interactionState.touchTarget = { type: 'background' };
                this.interactionState.isPanning = true;
            }
        } else if (touches.length === 2) {
            // Two fingers - pinch to zoom
            this.interactionState.isPinching = true;
            this.interactionState.isPanning = false;

            const touch1 = touches[0];
            const touch2 = touches[1];

            this.interactionState.lastPinchDistance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            this.interactionState.lastPinchCenterX = (touch1.clientX + touch2.clientX) / 2;
            this.interactionState.lastPinchCenterY = (touch1.clientY + touch2.clientY) / 2;
        }
    }

    /**
     * Handle node touch start
     */
    private handleNodeTouchStart(e: TouchEvent, node: Node<T>): void {
        e.preventDefault();
        if (e.touches.length > 1) return;

        this.interactionState.isDragging = true;
        this.interactionState.dragNode = node;
        this.interactionState.wasNodeFixed = node.isFixed;

        this.callbacks.fixNode?.(node);

        this.interactionState.dragStartPosition = { x: node.position.x, y: node.position.y };
    }

    /**
     * Handle touch move
     */
    private handleTouchMove(e: TouchEvent): void {
        e.preventDefault();
        const touches = e.touches;
        const handler = this.getTouchMoveHandler(touches);
        handler?.(touches);
    }

    /**
     * Get appropriate touch move handler based on current state
     * Reduces cyclomatic complexity from CC:11 to CC:3
     * @private
     */
    private getTouchMoveHandler(
        touches: TouchList
    ): ((touches: TouchList | Touch[]) => void) | null {
        if (
            touches.length === 1 &&
            this.interactionState.isDragging &&
            this.interactionState.dragNode
        ) {
            return (touches: TouchList | Touch[]) => this.handleTouchNodeDrag(touches[0] as Touch);
        }

        if (touches.length === 1 && this.interactionState.isPanning) {
            return (touches: TouchList | Touch[]) => this.handleTouchPan(touches[0] as Touch);
        }

        if (touches.length === 2 && this.interactionState.isPinching) {
            return (touches: TouchList | Touch[]) => this.handleTouchPinch(touches as TouchList);
        }

        return null;
    }

    /**
     * Handle touch node dragging
     */
    private handleTouchNodeDrag(touch: Touch): void {
        if (!this.svg || !this.interactionState.dragNode) return;

        const rect = this.svg.getBoundingClientRect();
        const newX =
            (touch.clientX - rect.left - this.transformState.x) / this.transformState.scale;
        const newY = (touch.clientY - rect.top - this.transformState.y) / this.transformState.scale;

        const oldPosition = this.interactionState.dragNode.position.clone();
        this.interactionState.dragNode.position.x = newX;
        this.interactionState.dragNode.position.y = newY;

        this.callbacks.showTooltip?.(this.interactionState.dragNode, {
            x: touch.clientX + 10,
            y: touch.clientY + 10
        });

        this.emit('nodeDrag', {
            node: this.interactionState.dragNode,
            position: { x: newX, y: newY },
            startPosition: this.interactionState.dragStartPosition || {
                x: oldPosition.x,
                y: oldPosition.y
            },
            delta: new Vector(newX - oldPosition.x, newY - oldPosition.y)
        } as DragEvent<T>);
    }

    /**
     * Handle touch panning
     */
    private handleTouchPan(touch: Touch): void {
        const deltaX = touch.clientX - this.interactionState.lastTouchX;
        const deltaY = touch.clientY - this.interactionState.lastTouchY;

        this.transformState.x += deltaX;
        this.transformState.y += deltaY;

        this.callbacks.updateTransform?.(
            this.transformState.x,
            this.transformState.y,
            this.transformState.scale
        );

        this.interactionState.lastTouchX = touch.clientX;
        this.interactionState.lastTouchY = touch.clientY;

        this.emit('pan', {
            x: this.transformState.x,
            y: this.transformState.y,
            deltaX,
            deltaY
        } as PanEvent);
    }

    /**
     * Handle pinch to zoom
     */
    private handleTouchPinch(touches: TouchList): void {
        if (!this.svg) return;

        const touch1 = touches[0];
        const touch2 = touches[1];

        const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        const currentCenterX = (touch1.clientX + touch2.clientX) / 2;
        const currentCenterY = (touch1.clientY + touch2.clientY) / 2;

        if (this.interactionState.lastPinchDistance > 0) {
            const scaleChange = currentDistance / this.interactionState.lastPinchDistance;
            const newScale = Math.max(0.2, Math.min(2.0, this.transformState.scale * scaleChange));

            // Zoom towards pinch center
            const rect = this.svg.getBoundingClientRect();
            const pinchX = currentCenterX - rect.left;
            const pinchY = currentCenterY - rect.top;

            const actualScaleChange = newScale / this.transformState.scale;
            this.transformState.x = pinchX - (pinchX - this.transformState.x) * actualScaleChange;
            this.transformState.y = pinchY - (pinchY - this.transformState.y) * actualScaleChange;
            this.transformState.scale = newScale;

            this.callbacks.updateTransform?.(
                this.transformState.x,
                this.transformState.y,
                this.transformState.scale
            );

            this.emit('zoom', {
                scale: this.transformState.scale,
                x: this.transformState.x,
                y: this.transformState.y,
                delta: scaleChange,
                center: { x: pinchX, y: pinchY }
            } as ZoomEvent);
        }

        this.interactionState.lastPinchDistance = currentDistance;
        this.interactionState.lastPinchCenterX = currentCenterX;
        this.interactionState.lastPinchCenterY = currentCenterY;
    }

    /**
     * Handle touch end
     */
    private handleTouchEnd(e: TouchEvent): void {
        const currentTime = Date.now();
        const touchDuration = currentTime - this.interactionState.touchStartTime;

        // Detect double-tap
        if (touchDuration < 300 && currentTime - this.interactionState.lastTouchEndTime < 500) {
            this.handleDoubleTap();
        }

        this.interactionState.lastTouchEndTime = currentTime;

        // Clean up touch states
        if (e.touches.length === 0) {
            if (this.interactionState.isDragging && this.interactionState.dragNode) {
                // Restore node's original fixed state
                if (!this.interactionState.wasNodeFixed) {
                    this.callbacks.unfixNode?.(this.interactionState.dragNode);
                }
            }

            this.interactionState.isDragging = false;
            this.interactionState.dragNode = null;
            this.interactionState.dragStartPosition = null;
            this.interactionState.isPanning = false;
            this.interactionState.isPinching = false;
            this.interactionState.wasNodeFixed = false;
            this.interactionState.touchTarget = null;

            this.callbacks.hideTooltip?.();
        } else if (e.touches.length === 1) {
            // One finger still down - switch from pinch to pan
            this.interactionState.isPinching = false;
            this.interactionState.lastPinchDistance = 0;
        }
    }

    /**
     * Handle double tap gesture
     */
    private handleDoubleTap(): void {
        if (this.interactionState.touchTarget?.type === 'node') {
            // Double-tap on node - filter
            this.callbacks.filterByNode?.(this.interactionState.touchTarget.node!.getId());
            this.emit('nodeDoubleClick', {
                node: this.interactionState.touchTarget.node!
            } as NodeEvent<T>);
        } else {
            // Double-tap on background - reset filter
            this.callbacks.resetFilter?.();
            this.emit('backgroundDoubleClick', {} as BackgroundEvent);
        }
    }

    /**
     * Handle window resize
     */
    private handleResize(): void {
        this.callbacks.resize?.();
        this.emit('resize', {});
    }

    /**
     * Update transform state
     * @param x - X translation
     * @param y - Y translation
     * @param scale - Scale factor
     */
    setTransform(x: number, y: number, scale: number): void {
        this.transformState.x = x;
        this.transformState.y = y;
        this.transformState.scale = scale;
    }

    /**
     * Get current transform state
     * @returns Copy of current transform state
     */
    getTransform(): TransformState {
        return { ...this.transformState };
    }

    /**
     * Update configuration
     * @param newConfig - Partial configuration to merge
     */
    updateConfig(newConfig: Partial<InteractionConfig>): void {
        Object.assign(this.config, newConfig);
    }

    /**
     * Get current configuration
     * @returns Copy of current configuration
     */
    getConfig(): InteractionConfig {
        return { ...this.config };
    }

    /**
     * Add event listener
     * @param event - Event name
     * @param callback - Event callback function
     */
    on<K extends string>(event: K, callback: EventCallback<EventData<T>>): void {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event)!.push(callback);
    }

    /**
     * Remove event listener
     * @param event - Event name
     * @param callback - Event callback function to remove
     */
    off<K extends string>(event: K, callback: EventCallback<EventData<T>>): void {
        if (this.eventCallbacks.has(event)) {
            const callbacks = this.eventCallbacks.get(event)!;
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Remove all event listeners for an event
     * @param event - Event name
     */
    removeAllListeners<K extends string>(event: K): void {
        this.eventCallbacks.delete(event);
    }

    /**
     * Emit event to all listeners
     * @param event - Event name
     * @param data - Event data
     */
    emit<K extends string>(event: K, data: EventData<T> = {}): void {
        if (this.eventCallbacks.has(event)) {
            this.eventCallbacks.get(event)!.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.logger.error(`Error in event callback for '${event}':`, error);
                }
            });
        }
    }

    /**
     * Get list of registered events
     * @returns Array of event names
     */
    getRegisteredEvents(): string[] {
        return Array.from(this.eventCallbacks.keys());
    }

    /**
     * Check if currently dragging a node
     * @returns True if dragging
     */
    isDragging(): boolean {
        return this.interactionState.isDragging;
    }

    /**
     * Check if currently panning
     * @returns True if panning
     */
    isPanning(): boolean {
        return this.interactionState.isPanning;
    }

    /**
     * Check if currently pinching (zooming)
     * @returns True if pinching
     */
    isPinching(): boolean {
        return this.interactionState.isPinching;
    }

    /**
     * Get currently dragged node
     * @returns Node being dragged or null
     */
    getDraggedNode(): Node<T> | null {
        return this.interactionState.dragNode;
    }

    /**
     * Force stop all interactions
     */
    stopAllInteractions(): void {
        if (this.interactionState.isDragging && this.interactionState.dragNode) {
            // Restore node's original fixed state
            if (!this.interactionState.wasNodeFixed) {
                this.callbacks.unfixNode?.(this.interactionState.dragNode);
            }
        }

        this.interactionState.isDragging = false;
        this.interactionState.dragNode = null;
        this.interactionState.isPanning = false;
        this.interactionState.isPinching = false;
        this.interactionState.wasNodeFixed = false;
        this.interactionState.touchTarget = null;
        this.interactionState.dragStartPosition = null;

        this.callbacks.hideTooltip?.();
    }

    /**
     * Programmatically zoom to a specific scale and center
     * @param scale - Target scale
     * @param centerX - X center point (screen coordinates)
     * @param centerY - Y center point (screen coordinates)
     * @param animate - Whether to animate the zoom (not implemented)
     */
    zoomTo(scale: number, centerX?: number, centerY?: number, _animate: boolean = false): void {
        if (!this.svg) return;

        const newScale = Math.max(0.2, Math.min(2.0, scale));

        if (centerX !== undefined && centerY !== undefined) {
            const rect = this.svg.getBoundingClientRect();
            const zoomX = centerX - rect.left;
            const zoomY = centerY - rect.top;

            const scaleChange = newScale / this.transformState.scale;
            this.transformState.x = zoomX - (zoomX - this.transformState.x) * scaleChange;
            this.transformState.y = zoomY - (zoomY - this.transformState.y) * scaleChange;
        }

        this.transformState.scale = newScale;
        this.callbacks.updateTransform?.(
            this.transformState.x,
            this.transformState.y,
            this.transformState.scale
        );

        this.emit('zoom', {
            scale: this.transformState.scale,
            x: this.transformState.x,
            y: this.transformState.y,
            center: centerX && centerY ? { x: centerX, y: centerY } : undefined
        } as ZoomEvent);
    }

    /**
     * Programmatically pan to a specific position
     * @param x - Target X position
     * @param y - Target Y position
     * @param animate - Whether to animate the pan (not implemented)
     */
    panTo(x: number, y: number, _animate: boolean = false): void {
        const deltaX = x - this.transformState.x;
        const deltaY = y - this.transformState.y;

        this.transformState.x = x;
        this.transformState.y = y;

        this.callbacks.updateTransform?.(
            this.transformState.x,
            this.transformState.y,
            this.transformState.scale
        );

        this.emit('pan', {
            x: this.transformState.x,
            y: this.transformState.y,
            deltaX,
            deltaY
        } as PanEvent);
    }

    /**
     * Convert screen coordinates to SVG coordinates
     * @param screenX - Screen X coordinate
     * @param screenY - Screen Y coordinate
     * @returns SVG coordinates
     */
    screenToSVG(screenX: number, screenY: number): Vector {
        if (!this.svg) return new Vector(screenX, screenY);

        const rect = this.svg.getBoundingClientRect();
        const svgX = (screenX - rect.left - this.transformState.x) / this.transformState.scale;
        const svgY = (screenY - rect.top - this.transformState.y) / this.transformState.scale;

        return new Vector(svgX, svgY);
    }

    /**
     * Convert SVG coordinates to screen coordinates
     * @param svgX - SVG X coordinate
     * @param svgY - SVG Y coordinate
     * @returns Screen coordinates
     */
    svgToScreen(svgX: number, svgY: number): Vector {
        if (!this.svg) return new Vector(svgX, svgY);

        const rect = this.svg.getBoundingClientRect();
        const screenX = svgX * this.transformState.scale + this.transformState.x + rect.left;
        const screenY = svgY * this.transformState.scale + this.transformState.y + rect.top;

        return new Vector(screenX, screenY);
    }

    /**
     * Update callbacks
     * @param newCallbacks - New callbacks to merge
     */
    updateCallbacks(newCallbacks: Partial<EventManagerCallbacks<T>>): void {
        this.callbacks = { ...this.callbacks, ...newCallbacks };
    }

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
    } {
        return {
            config: this.config,
            transformState: this.transformState,
            interactionState: {
                isDragging: this.interactionState.isDragging,
                isPanning: this.interactionState.isPanning,
                isPinching: this.interactionState.isPinching,
                dragNodeId: this.interactionState.dragNode?.getId() || null
            },
            registeredEvents: this.getRegisteredEvents(),
            type: 'EventManager',
            version: '2.0.0'
        };
    }

    /**
     * Clean up event listeners and references
     */
    destroy(): void {
        // Remove window event listeners
        window.removeEventListener('resize', () => this.handleResize());

        // Clear event callbacks
        this.eventCallbacks.clear();

        // Stop all interactions
        this.stopAllInteractions();

        // Clear references
        this.svg = null;
        this.nodes = null;
        this.callbacks = {};
    }

    /**
     * Create a string representation of the event manager
     * @returns String representation
     */
    toString(): string {
        return `EventManager(events: ${this.getRegisteredEvents().length}, scale: ${this.transformState.scale.toFixed(2)})`;
    }
}
