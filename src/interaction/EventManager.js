/**
 * EventManager - Handles all user interactions and event management
 * Extracted from monolithic GraphNetwork class for better separation of concerns
 */
export class EventManager {
    constructor(config = {}) {
        this.config = config;
        
        // Event system
        this.eventCallbacks = new Map();
        
        // Interaction state
        this.isDragging = false;
        this.isPanning = false;
        this.isPinching = false;
        this.dragNode = null;
        this.wasNodeFixed = false;
        
        // Touch interaction state
        this.lastTouchTime = 0;
        this.touchStartTime = 0;
        this.lastTouchEndTime = 0;
        this.touchTarget = null;
        this.dragStartPosition = null;
        this.lastPinchDistance = 0;
        
        // Transform state
        this.transformState = {
            x: 0,
            y: 0,
            scale: 1
        };
        
        // References (set during initialization)
        this.svg = null;
        this.nodes = null;
        this.callbacks = {};
    }

    /**
     * Initialize event manager with required references
     */
    initialize(svg, nodes, callbacks = {}) {
        this.svg = svg;
        this.nodes = nodes;
        this.callbacks = callbacks;
        this.setupEventListeners();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        if (!this.svg) return;
        
        // Setup node event listeners
        this.setupNodeEventListeners();
        
        // SVG-level events
        this.svg.addEventListener('mousedown', (e) => this.handleSvgMouseDown(e));
        this.svg.addEventListener('mousemove', (e) => this.handleSvgMouseMove(e));
        this.svg.addEventListener('mouseup', () => this.handleSvgMouseUp());
        this.svg.addEventListener('dblclick', (e) => this.handleSvgDoubleClick(e));
        this.svg.addEventListener('wheel', (e) => this.handleWheel(e));

        // Touch events
        this.svg.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.svg.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.svg.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.svg.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

        // Window events
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Setup event listeners for node interactions
     */
    setupNodeEventListeners() {
        if (!this.nodes || !this.callbacks.getNodeElements) return;
        
        const nodeElements = this.callbacks.getNodeElements();
        
        this.nodes.forEach(node => {
            const elements = nodeElements.get(node);
            if (!elements) return;
            
            // Mouse events
            elements.group.addEventListener('mousedown', (e) => {
                this.handleNodeMouseDown(e, node);
            });
            
            elements.group.addEventListener('dblclick', (e) => {
                this.handleNodeDoubleClick(e, node);
            });

            // Touch events for nodes
            elements.group.addEventListener('touchstart', (e) => {
                this.handleNodeTouchStart(e, node);
            });
        });
    }

    /**
     * Handle node mouse down (start dragging)
     */
    handleNodeMouseDown(e, node) {
        e.preventDefault();
        
        this.isDragging = true;
        this.dragNode = node;
        this.wasNodeFixed = node.isFixed;
        
        if (this.callbacks.fixNode) {
            this.callbacks.fixNode(node);
        }
        
        this.emit('nodeMouseDown', { node, event: e });
    }

    /**
     * Handle node double click (filtering)
     */
    handleNodeDoubleClick(e, node) {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.callbacks.filterByNode) {
            this.callbacks.filterByNode(node.data.id);
        }
        
        this.emit('nodeDoubleClick', { node, event: e });
    }

    /**
     * Handle SVG mouse down (start panning)
     */
    handleSvgMouseDown(e) {
        if (this.isDragging) return;
        
        this.isPanning = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    /**
     * Handle SVG double click (reset filter)
     */
    handleSvgDoubleClick(e) {
        e.preventDefault();
        
        if (this.callbacks.resetFilter) {
            this.callbacks.resetFilter();
        }
        
        this.emit('backgroundDoubleClick', { event: e });
    }

    /**
     * Handle mouse move (dragging/panning)
     */
    handleSvgMouseMove(e) {
        if (this.isDragging && this.dragNode) {
            this.handleNodeDrag(e);
        } else if (this.isPanning) {
            this.handlePan(e);
        }
    }

    /**
     * Handle node dragging
     */
    handleNodeDrag(e) {
        if (!this.svg || !this.dragNode) return;
        
        const rect = this.svg.getBoundingClientRect();
        const newX = (e.clientX - rect.left - this.transformState.x) / this.transformState.scale;
        const newY = (e.clientY - rect.top - this.transformState.y) / this.transformState.scale;
        
        this.dragNode.position.x = newX;
        this.dragNode.position.y = newY;
        
        if (this.callbacks.showTooltip) {
            this.callbacks.showTooltip(this.dragNode, { x: e.clientX + 10, y: e.clientY + 10 });
        }
    }

    /**
     * Handle view panning
     */
    handlePan(e) {
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        
        this.transformState.x += deltaX;
        this.transformState.y += deltaY;
        
        if (this.callbacks.updateTransform) {
            this.callbacks.updateTransform(this.transformState.x, this.transformState.y, this.transformState.scale);
        }
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    /**
     * Handle mouse up (stop dragging/panning)
     */
    handleSvgMouseUp() {
        if (this.isDragging && this.dragNode) {
            // Restore node's original fixed state
            if (!this.wasNodeFixed && this.callbacks.unfixNode) {
                this.callbacks.unfixNode(this.dragNode);
            }
        }
        
        this.isDragging = false;
        this.dragNode = null;
        this.isPanning = false;
        this.wasNodeFixed = false;
        
        if (this.callbacks.hideTooltip) {
            this.callbacks.hideTooltip();
        }
    }

    /**
     * Handle mouse wheel (zooming)
     */
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomDelta = e.deltaY > 0 ? 1 / this.config.zoomSensitivity : this.config.zoomSensitivity;
        const newScale = Math.max(0.2, Math.min(2.0, this.transformState.scale * zoomDelta));
        
        // Zoom towards mouse position
        const scaleChange = newScale / this.transformState.scale;
        this.transformState.x = mouseX - (mouseX - this.transformState.x) * scaleChange;
        this.transformState.y = mouseY - (mouseY - this.transformState.y) * scaleChange;
        this.transformState.scale = newScale;
        
        if (this.callbacks.updateTransform) {
            this.callbacks.updateTransform(this.transformState.x, this.transformState.y, this.transformState.scale);
        }
        
        this.emit('zoom', { scale: this.transformState.scale, x: this.transformState.x, y: this.transformState.y });
    }

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        e.preventDefault();
        
        this.touchStartTime = Date.now();
        const touches = e.touches;
        
        if (touches.length === 1) {
            // Single touch - could be pan or drag
            const touch = touches[0];
            this.lastTouchX = touch.clientX;
            this.lastTouchY = touch.clientY;
            
            // Check if touching a node
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            const nodeGroup = target?.closest('g[data-id]');
            
            if (nodeGroup) {
                const nodeId = nodeGroup.getAttribute('data-id');
                const node = this.nodes.get(nodeId);
                
                if (node) {
                    this.touchTarget = { type: 'node', node, element: nodeGroup };
                }
            } else {
                this.touchTarget = { type: 'background' };
                this.isPanning = true;
            }
        } else if (touches.length === 2) {
            // Two fingers - pinch to zoom
            this.isPinching = true;
            this.isPanning = false;
            
            const touch1 = touches[0];
            const touch2 = touches[1];
            
            this.lastPinchDistance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) + 
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            
            this.lastPinchCenterX = (touch1.clientX + touch2.clientX) / 2;
            this.lastPinchCenterY = (touch1.clientY + touch2.clientY) / 2;
        }
    }

    /**
     * Handle node touch start
     */
    handleNodeTouchStart(e, node) {
        e.preventDefault();
        if (e.touches.length > 1) return;
        
        this.isDragging = true;
        this.dragNode = node;
        this.wasNodeFixed = node.isFixed;
        
        if (this.callbacks.fixNode) {
            this.callbacks.fixNode(node);
        }
        
        this.dragStartPosition = { x: node.position.x, y: node.position.y };
    }

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        e.preventDefault();
        
        const touches = e.touches;
        
        if (touches.length === 1 && this.isDragging && this.dragNode) {
            // Single finger drag (node)
            this.handleTouchNodeDrag(touches[0]);
        } else if (touches.length === 1 && this.isPanning) {
            // Single finger pan (background)
            this.handleTouchPan(touches[0]);
        } else if (touches.length === 2 && this.isPinching) {
            // Two finger pinch zoom
            this.handleTouchPinch(touches);
        }
    }

    /**
     * Handle touch node dragging
     */
    handleTouchNodeDrag(touch) {
        if (!this.svg || !this.dragNode) return;
        
        const rect = this.svg.getBoundingClientRect();
        const newX = (touch.clientX - rect.left - this.transformState.x) / this.transformState.scale;
        const newY = (touch.clientY - rect.top - this.transformState.y) / this.transformState.scale;
        
        this.dragNode.position.x = newX;
        this.dragNode.position.y = newY;
        
        if (this.callbacks.showTooltip) {
            this.callbacks.showTooltip(this.dragNode, { x: touch.clientX + 10, y: touch.clientY + 10 });
        }
    }

    /**
     * Handle touch panning
     */
    handleTouchPan(touch) {
        const deltaX = touch.clientX - this.lastTouchX;
        const deltaY = touch.clientY - this.lastTouchY;
        
        this.transformState.x += deltaX;
        this.transformState.y += deltaY;
        
        if (this.callbacks.updateTransform) {
            this.callbacks.updateTransform(this.transformState.x, this.transformState.y, this.transformState.scale);
        }
        
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
    }

    /**
     * Handle pinch to zoom
     */
    handleTouchPinch(touches) {
        const touch1 = touches[0];
        const touch2 = touches[1];
        
        const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) + 
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        const currentCenterX = (touch1.clientX + touch2.clientX) / 2;
        const currentCenterY = (touch1.clientY + touch2.clientY) / 2;
        
        if (this.lastPinchDistance > 0) {
            const scaleChange = currentDistance / this.lastPinchDistance;
            const newScale = Math.max(0.2, Math.min(2.0, this.transformState.scale * scaleChange));
            
            // Zoom towards pinch center
            const rect = this.svg.getBoundingClientRect();
            const pinchX = currentCenterX - rect.left;
            const pinchY = currentCenterY - rect.top;
            
            const actualScaleChange = newScale / this.transformState.scale;
            this.transformState.x = pinchX - (pinchX - this.transformState.x) * actualScaleChange;
            this.transformState.y = pinchY - (pinchY - this.transformState.y) * actualScaleChange;
            this.transformState.scale = newScale;
            
            if (this.callbacks.updateTransform) {
                this.callbacks.updateTransform(this.transformState.x, this.transformState.y, this.transformState.scale);
            }
        }
        
        this.lastPinchDistance = currentDistance;
        this.lastPinchCenterX = currentCenterX;
        this.lastPinchCenterY = currentCenterY;
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        const currentTime = Date.now();
        const touchDuration = currentTime - this.touchStartTime;
        
        // Detect double-tap
        if (touchDuration < 300 && currentTime - this.lastTouchEndTime < 500) {
            this.handleDoubleTap();
        }
        
        this.lastTouchEndTime = currentTime;
        
        // Clean up touch states
        if (e.touches.length === 0) {
            if (this.isDragging && this.dragNode) {
                // Restore node's original fixed state
                if (!this.wasNodeFixed && this.callbacks.unfixNode) {
                    this.callbacks.unfixNode(this.dragNode);
                }
            }
            
            this.isDragging = false;
            this.dragNode = null;
            this.dragStartPosition = null;
            this.isPanning = false;
            this.isPinching = false;
            this.wasNodeFixed = false;
            this.touchTarget = null;
            
            if (this.callbacks.hideTooltip) {
                this.callbacks.hideTooltip();
            }
        } else if (e.touches.length === 1) {
            // One finger still down - switch from pinch to pan
            this.isPinching = false;
            this.lastPinchDistance = 0;
        }
    }

    /**
     * Handle double tap gesture
     */
    handleDoubleTap() {
        if (this.touchTarget?.type === 'node') {
            // Double-tap on node - filter
            if (this.callbacks.filterByNode) {
                this.callbacks.filterByNode(this.touchTarget.node.data.id);
            }
            this.emit('nodeDoubleClick', { node: this.touchTarget.node });
        } else {
            // Double-tap on background - reset filter
            if (this.callbacks.resetFilter) {
                this.callbacks.resetFilter();
            }
            this.emit('backgroundDoubleClick', {});
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (this.callbacks.resize) {
            this.callbacks.resize();
        }
        this.emit('resize', {});
    }

    /**
     * Update transform state
     */
    setTransform(x, y, scale) {
        this.transformState.x = x;
        this.transformState.y = y;
        this.transformState.scale = scale;
    }

    /**
     * Get current transform state
     */
    getTransform() {
        return { ...this.transformState };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.eventCallbacks.has(event)) {
            const callbacks = this.eventCallbacks.get(event);
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to all listeners
     */
    emit(event, data = {}) {
        if (this.eventCallbacks.has(event)) {
            this.eventCallbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event callback for '${event}':`, error);
                }
            });
        }
    }

    /**
     * Clean up event listeners and references
     */
    destroy() {
        // Remove window event listeners
        window.removeEventListener('resize', () => this.handleResize());
        
        // Clear event callbacks
        this.eventCallbacks.clear();
        
        // Clear references
        this.svg = null;
        this.nodes = null;
        this.callbacks = {};
    }
}