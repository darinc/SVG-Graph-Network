/**
 * TouchInteractionHandler - Handles touch events for graph interaction
 *
 * Extracted from EventManager to provide focused responsibility for:
 * - Touch start, move, end events
 * - Single finger panning and node dragging
 * - Two finger pinch-to-zoom
 * - Double-tap gesture detection
 * - Touch target identification
 */

import { Node } from '../../Node';
import { Vector } from '../../Vector';
import { NodeData, Position, InteractionConfig } from '../../types/index';
import { EventManagerCallbacks } from '../EventManager';

export interface TouchTarget<T extends NodeData = NodeData> {
    type: 'node' | 'background';
    node?: Node<T>;
    element?: Element;
}

export interface TouchInteractionState<T extends NodeData = NodeData> {
    isDragging: boolean;
    isPanning: boolean;
    isPinching: boolean;
    dragNode: Node<T> | null;
    wasNodeFixed: boolean;
    touchTarget: TouchTarget<T> | null;
    dragStartPosition: Position | null;

    // Touch timing
    lastTouchTime: number;
    touchStartTime: number;
    lastTouchEndTime: number;

    // Single touch state
    lastTouchX: number;
    lastTouchY: number;

    // Pinch state
    lastPinchDistance: number;
    lastPinchCenterX: number;
    lastPinchCenterY: number;
}

/**
 * Handles all touch-based interactions
 */
export class TouchInteractionHandler<T extends NodeData = NodeData> {
    private state: TouchInteractionState<T>;
    private config: InteractionConfig;
    private callbacks: EventManagerCallbacks<T>;
    private transformState: { x: number; y: number; scale: number };
    private eventEmitter: { emit: (event: string, data: any) => void };

    // References
    private svg: SVGSVGElement | null = null;
    private nodes: Map<string, Node<T>> | null = null;

    constructor(
        config: InteractionConfig,
        callbacks: EventManagerCallbacks<T>,
        transformState: { x: number; y: number; scale: number },
        eventEmitter: { emit: (event: string, data: any) => void }
    ) {
        this.config = config;
        this.callbacks = callbacks;
        this.transformState = transformState;
        this.eventEmitter = eventEmitter;

        this.state = {
            isDragging: false,
            isPanning: false,
            isPinching: false,
            dragNode: null,
            wasNodeFixed: false,
            touchTarget: null,
            dragStartPosition: null,
            lastTouchTime: 0,
            touchStartTime: 0,
            lastTouchEndTime: 0,
            lastTouchX: 0,
            lastTouchY: 0,
            lastPinchDistance: 0,
            lastPinchCenterX: 0,
            lastPinchCenterY: 0
        };
    }

    /**
     * Initialize with SVG and nodes references
     */
    initialize(svg: SVGSVGElement, nodes: Map<string, Node<T>>): void {
        this.svg = svg;
        this.nodes = nodes;
        this.setupEventListeners();
        this.setupNodeEventListeners();
    }

    /**
     * Setup SVG-level touch event listeners
     */
    private setupEventListeners(): void {
        if (!this.svg) return;

        this.svg.addEventListener('touchstart', e => this.handleTouchStart(e), { passive: false });
        this.svg.addEventListener('touchmove', e => this.handleTouchMove(e), { passive: false });
        this.svg.addEventListener('touchend', e => this.handleTouchEnd(e), { passive: false });
        this.svg.addEventListener('touchcancel', e => this.handleTouchEnd(e), { passive: false });
    }

    /**
     * Setup node-specific touch event listeners
     */
    private setupNodeEventListeners(): void {
        if (!this.nodes || !this.callbacks.getNodeElements) return;

        const nodeElements = this.callbacks.getNodeElements();

        this.nodes.forEach(node => {
            const elements = nodeElements.get(node);
            if (!elements) return;

            elements.group.addEventListener('touchstart', (e: TouchEvent) => {
                this.handleNodeTouchStart(e, node);
            });
        });
    }

    /**
     * Handle touch start
     */
    private handleTouchStart(e: TouchEvent): void {
        e.preventDefault();

        this.state.touchStartTime = Date.now();
        const touches = e.touches;

        if (touches.length === 1) {
            // Single touch - could be pan or drag
            const touch = touches[0];
            this.state.lastTouchX = touch.clientX;
            this.state.lastTouchY = touch.clientY;

            // Check if touching a node
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            const nodeGroup = target?.closest('g[data-id]');

            if (nodeGroup) {
                const nodeId = nodeGroup.getAttribute('data-id');
                const node = this.nodes?.get(nodeId || '');

                if (node) {
                    this.state.touchTarget = { type: 'node', node, element: nodeGroup };
                }
            } else {
                this.callbacks.closeSettings?.();
                this.state.touchTarget = { type: 'background' };
                this.state.isPanning = true;
            }
        } else if (touches.length === 2) {
            // Two fingers - pinch to zoom
            this.state.isPinching = true;
            this.state.isPanning = false;

            const touch1 = touches[0];
            const touch2 = touches[1];

            this.state.lastPinchDistance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            this.state.lastPinchCenterX = (touch1.clientX + touch2.clientX) / 2;
            this.state.lastPinchCenterY = (touch1.clientY + touch2.clientY) / 2;
        }
    }

    /**
     * Handle node touch start
     */
    private handleNodeTouchStart(e: TouchEvent, node: Node<T>): void {
        e.preventDefault();
        if (e.touches.length > 1) return;

        this.state.isDragging = true;
        this.state.dragNode = node;
        this.state.wasNodeFixed = node.isFixed;
        this.state.dragStartPosition = { x: node.position.x, y: node.position.y };

        this.callbacks.fixNode?.(node);
    }

    /**
     * Handle touch move - uses state machine pattern to reduce complexity
     */
    private handleTouchMove(e: TouchEvent): void {
        e.preventDefault();
        const touches = e.touches;
        const handler = this.getTouchMoveHandler(touches);
        handler?.(touches);
    }

    /**
     * Get appropriate touch move handler based on current state
     * Reduces cyclomatic complexity using state machine pattern
     * @private
     */
    private getTouchMoveHandler(
        touches: TouchList
    ): ((touches: TouchList | Touch[]) => void) | null {
        if (touches.length === 1 && this.state.isDragging && this.state.dragNode) {
            return (touches: TouchList | Touch[]) => this.handleTouchNodeDrag(touches[0] as Touch);
        }

        if (touches.length === 1 && this.state.isPanning) {
            return (touches: TouchList | Touch[]) => this.handleTouchPan(touches[0] as Touch);
        }

        if (touches.length === 2 && this.state.isPinching) {
            return (touches: TouchList | Touch[]) => this.handleTouchPinch(touches as TouchList);
        }

        return null;
    }

    /**
     * Handle touch node dragging
     */
    private handleTouchNodeDrag(touch: Touch): void {
        if (!this.svg || !this.state.dragNode) return;

        const rect = this.svg.getBoundingClientRect();
        const newX =
            (touch.clientX - rect.left - this.transformState.x) / this.transformState.scale;
        const newY = (touch.clientY - rect.top - this.transformState.y) / this.transformState.scale;

        const oldPosition = this.state.dragNode.position.clone();
        this.state.dragNode.position.x = newX;
        this.state.dragNode.position.y = newY;

        this.callbacks.showTooltip?.(this.state.dragNode, {
            x: touch.clientX + 10,
            y: touch.clientY + 10
        });

        this.eventEmitter.emit('nodeDrag', {
            node: this.state.dragNode,
            position: { x: newX, y: newY },
            startPosition: this.state.dragStartPosition || {
                x: oldPosition.x,
                y: oldPosition.y
            },
            delta: new Vector(newX - oldPosition.x, newY - oldPosition.y)
        });
    }

    /**
     * Handle touch panning
     */
    private handleTouchPan(touch: Touch): void {
        const deltaX = touch.clientX - this.state.lastTouchX;
        const deltaY = touch.clientY - this.state.lastTouchY;

        this.transformState.x += deltaX;
        this.transformState.y += deltaY;

        this.callbacks.updateTransform?.(
            this.transformState.x,
            this.transformState.y,
            this.transformState.scale
        );

        this.state.lastTouchX = touch.clientX;
        this.state.lastTouchY = touch.clientY;

        this.eventEmitter.emit('pan', {
            x: this.transformState.x,
            y: this.transformState.y,
            deltaX,
            deltaY
        });
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

        if (this.state.lastPinchDistance > 0) {
            const scaleChange = currentDistance / this.state.lastPinchDistance;
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

            this.eventEmitter.emit('zoom', {
                scale: this.transformState.scale,
                x: this.transformState.x,
                y: this.transformState.y,
                delta: scaleChange,
                center: { x: pinchX, y: pinchY }
            });
        }

        this.state.lastPinchDistance = currentDistance;
        this.state.lastPinchCenterX = currentCenterX;
        this.state.lastPinchCenterY = currentCenterY;
    }

    /**
     * Handle touch end
     */
    private handleTouchEnd(e: TouchEvent): void {
        const currentTime = Date.now();
        const touchDuration = currentTime - this.state.touchStartTime;

        // Detect double-tap
        if (touchDuration < 300 && currentTime - this.state.lastTouchEndTime < 500) {
            this.handleDoubleTap();
        }

        this.state.lastTouchEndTime = currentTime;

        // Clean up touch states
        if (e.touches.length === 0) {
            if (this.state.isDragging && this.state.dragNode) {
                // Restore node's original fixed state
                if (!this.state.wasNodeFixed) {
                    this.callbacks.unfixNode?.(this.state.dragNode);
                }
            }

            this.resetTouchState();
        } else if (e.touches.length === 1) {
            // One finger still down - switch from pinch to pan
            this.state.isPinching = false;
            this.state.lastPinchDistance = 0;
        }
    }

    /**
     * Handle double tap gesture
     */
    private handleDoubleTap(): void {
        if (this.state.touchTarget?.type === 'node') {
            // Double-tap on node - filter
            this.callbacks.filterByNode?.(this.state.touchTarget.node!.getId());
            this.eventEmitter.emit('nodeDoubleClick', {
                node: this.state.touchTarget.node!
            });
        } else {
            // Double-tap on background - reset filter
            this.callbacks.resetFilter?.();
            this.eventEmitter.emit('backgroundDoubleClick', {});
        }
    }

    /**
     * Reset touch state
     */
    private resetTouchState(): void {
        this.state.isDragging = false;
        this.state.dragNode = null;
        this.state.dragStartPosition = null;
        this.state.isPanning = false;
        this.state.isPinching = false;
        this.state.wasNodeFixed = false;
        this.state.touchTarget = null;

        this.callbacks.hideTooltip?.();
    }

    /**
     * Get current interaction state
     */
    getState(): Readonly<TouchInteractionState<T>> {
        return { ...this.state };
    }

    /**
     * Check if currently dragging
     */
    isDragging(): boolean {
        return this.state.isDragging;
    }

    /**
     * Check if currently panning
     */
    isPanning(): boolean {
        return this.state.isPanning;
    }

    /**
     * Check if currently pinching
     */
    isPinching(): boolean {
        return this.state.isPinching;
    }

    /**
     * Get currently dragged node
     */
    getDraggedNode(): Node<T> | null {
        return this.state.dragNode;
    }

    /**
     * Stop all touch interactions
     */
    stopAllInteractions(): void {
        if (this.state.isDragging && this.state.dragNode) {
            if (!this.state.wasNodeFixed) {
                this.callbacks.unfixNode?.(this.state.dragNode);
            }
        }

        this.resetTouchState();
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<InteractionConfig>): void {
        Object.assign(this.config, config);
    }

    /**
     * Update callbacks
     */
    updateCallbacks(callbacks: Partial<EventManagerCallbacks<T>>): void {
        Object.assign(this.callbacks, callbacks);
    }

    /**
     * Clean up event listeners
     */
    destroy(): void {
        this.svg = null;
        this.nodes = null;
    }
}
