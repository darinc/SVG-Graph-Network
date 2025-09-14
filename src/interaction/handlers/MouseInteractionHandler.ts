/**
 * MouseInteractionHandler - Handles mouse events for graph interaction
 *
 * Extracted from EventManager to provide focused responsibility for:
 * - Mouse down, move, up events
 * - Mouse wheel zooming
 * - Node dragging via mouse
 * - Background panning via mouse
 * - Double-click interactions
 */

import { Node } from '../../Node';
import { Vector } from '../../Vector';
import { NodeData, Position, InteractionConfig } from '../../types/index';
import { EventManagerCallbacks } from '../EventManager';

export interface MouseInteractionState<T extends NodeData = NodeData> {
    isDragging: boolean;
    isPanning: boolean;
    dragNode: Node<T> | null;
    wasNodeFixed: boolean;
    lastMouseX: number;
    lastMouseY: number;
    dragStartPosition: Position | null;
}

/**
 * Handles all mouse-based interactions
 */
export class MouseInteractionHandler<T extends NodeData = NodeData> {
    private state: MouseInteractionState<T>;
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
            dragNode: null,
            wasNodeFixed: false,
            lastMouseX: 0,
            lastMouseY: 0,
            dragStartPosition: null
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
     * Setup SVG-level mouse event listeners
     */
    private setupEventListeners(): void {
        if (!this.svg) return;

        this.svg.addEventListener('mousedown', e => this.handleSvgMouseDown(e));
        this.svg.addEventListener('mousemove', e => this.handleSvgMouseMove(e));
        this.svg.addEventListener('mouseup', () => this.handleSvgMouseUp());
        this.svg.addEventListener('dblclick', e => this.handleSvgDoubleClick(e));
        this.svg.addEventListener('wheel', e => this.handleWheel(e));
    }

    /**
     * Setup node-specific mouse event listeners
     */
    private setupNodeEventListeners(): void {
        if (!this.nodes || !this.callbacks.getNodeElements) return;

        const nodeElements = this.callbacks.getNodeElements();

        this.nodes.forEach(node => {
            const elements = nodeElements.get(node);
            if (!elements) return;

            elements.group.addEventListener('mousedown', (e: MouseEvent) => {
                this.handleNodeMouseDown(e, node);
            });

            elements.group.addEventListener('dblclick', (e: MouseEvent) => {
                this.handleNodeDoubleClick(e, node);
            });
        });
    }

    /**
     * Handle node mouse down (start dragging)
     */
    private handleNodeMouseDown(e: MouseEvent, node: Node<T>): void {
        e.preventDefault();

        this.state.isDragging = true;
        this.state.dragNode = node;
        this.state.wasNodeFixed = node.isFixed;
        this.state.dragStartPosition = { x: node.position.x, y: node.position.y };

        this.callbacks.fixNode?.(node);

        this.eventEmitter.emit('nodeMouseDown', {
            node,
            event: e,
            position: { x: e.clientX, y: e.clientY }
        });
    }

    /**
     * Handle node double click (filtering)
     */
    private handleNodeDoubleClick(e: MouseEvent, node: Node<T>): void {
        e.preventDefault();
        e.stopPropagation();

        this.callbacks.filterByNode?.(node.getId());

        this.eventEmitter.emit('nodeDoubleClick', {
            node,
            event: e,
            position: { x: e.clientX, y: e.clientY }
        });
    }

    /**
     * Handle SVG mouse down (start panning)
     */
    private handleSvgMouseDown(e: MouseEvent): void {
        if (this.state.isDragging) return;

        this.callbacks.closeSettings?.();

        this.state.isPanning = true;
        this.state.lastMouseX = e.clientX;
        this.state.lastMouseY = e.clientY;
    }

    /**
     * Handle SVG double click (reset filter)
     */
    private handleSvgDoubleClick(e: MouseEvent): void {
        e.preventDefault();

        this.callbacks.resetFilter?.();

        this.eventEmitter.emit('backgroundDoubleClick', {
            event: e,
            position: { x: e.clientX, y: e.clientY }
        });
    }

    /**
     * Handle mouse move (dragging/panning)
     */
    private handleSvgMouseMove(e: MouseEvent): void {
        if (this.state.isDragging && this.state.dragNode) {
            this.handleNodeDrag(e);
        } else if (this.state.isPanning) {
            this.handlePan(e);
        }
    }

    /**
     * Handle node dragging
     */
    private handleNodeDrag(e: MouseEvent): void {
        if (!this.svg || !this.state.dragNode) return;

        const rect = this.svg.getBoundingClientRect();
        const newX = (e.clientX - rect.left - this.transformState.x) / this.transformState.scale;
        const newY = (e.clientY - rect.top - this.transformState.y) / this.transformState.scale;

        const oldPosition = this.state.dragNode.position.clone();
        this.state.dragNode.position.x = newX;
        this.state.dragNode.position.y = newY;

        this.callbacks.showTooltip?.(this.state.dragNode, {
            x: e.clientX + 10,
            y: e.clientY + 10
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
     * Handle view panning
     */
    private handlePan(e: MouseEvent): void {
        const deltaX = e.clientX - this.state.lastMouseX;
        const deltaY = e.clientY - this.state.lastMouseY;

        this.transformState.x += deltaX;
        this.transformState.y += deltaY;

        this.callbacks.updateTransform?.(
            this.transformState.x,
            this.transformState.y,
            this.transformState.scale
        );

        this.state.lastMouseX = e.clientX;
        this.state.lastMouseY = e.clientY;

        this.eventEmitter.emit('pan', {
            x: this.transformState.x,
            y: this.transformState.y,
            deltaX,
            deltaY
        });
    }

    /**
     * Handle mouse up (stop dragging/panning)
     */
    private handleSvgMouseUp(): void {
        if (this.state.isDragging && this.state.dragNode) {
            // Restore node's original fixed state
            if (!this.state.wasNodeFixed) {
                this.callbacks.unfixNode?.(this.state.dragNode);
            }
        }

        this.state.isDragging = false;
        this.state.dragNode = null;
        this.state.isPanning = false;
        this.state.wasNodeFixed = false;
        this.state.dragStartPosition = null;

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

        this.eventEmitter.emit('zoom', {
            scale: this.transformState.scale,
            x: this.transformState.x,
            y: this.transformState.y,
            delta: zoomDelta,
            center: { x: mouseX, y: mouseY }
        });
    }

    /**
     * Get current interaction state
     */
    getState(): Readonly<MouseInteractionState<T>> {
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
     * Get currently dragged node
     */
    getDraggedNode(): Node<T> | null {
        return this.state.dragNode;
    }

    /**
     * Stop all mouse interactions
     */
    stopAllInteractions(): void {
        if (this.state.isDragging && this.state.dragNode) {
            if (!this.state.wasNodeFixed) {
                this.callbacks.unfixNode?.(this.state.dragNode);
            }
        }

        this.state.isDragging = false;
        this.state.dragNode = null;
        this.state.isPanning = false;
        this.state.wasNodeFixed = false;
        this.state.dragStartPosition = null;

        this.callbacks.hideTooltip?.();
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
        // Event listeners are automatically removed when DOM elements are destroyed
        this.svg = null;
        this.nodes = null;
    }
}
