/**
 * SVGRenderer - Handles all SVG creation, manipulation, and rendering
 * Extracted from monolithic GraphNetwork class for better separation of concerns
 */
export class SVGRenderer {
    constructor(container, containerId, config = {}) {
        this.container = container;
        this.containerId = containerId;
        this.config = config;
        
        // SVG elements
        this.canvas = null;
        this.svg = null;
        this.transformGroup = null;
        this.linkGroup = null;
        this.nodeGroup = null;
        this.labelGroup = null;
        
        // Element tracking
        this.nodeElements = new Map();
        this.linkElements = new Map();
        
        // Transform state
        this.transformState = {
            x: 0,
            y: 0,
            scale: 1
        };
        
        // Text measurement canvas
        this.textCanvas = null;
        this.textContext = null;
    }

    /**
     * Initialize SVG container and structure
     */
    initialize() {
        this.createSVGContainer();
        this.setupTextMeasurement();
    }

    /**
     * Create main SVG container and groups
     */
    createSVGContainer() {
        // Remove any existing canvas/SVG (for HMR)
        const existingCanvas = this.container.querySelector('.graph-network-canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        
        const rect = this.container.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        
        // Create canvas wrapper for grid background
        this.canvas = document.createElement('div');
        this.canvas.className = 'graph-network-canvas';
        this.container.appendChild(this.canvas);
        
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', containerWidth);
        this.svg.setAttribute('height', containerHeight);
        this.svg.style.display = 'block';
        this.svg.style.backgroundColor = 'var(--bg-primary)';
        
        // Create transform group for pan/zoom
        this.transformGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.transformGroup.classList.add('transform-group');
        
        // Create layer groups
        this.linkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.linkGroup.classList.add('links');
        
        this.labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.labelGroup.classList.add('edge-labels');
        
        this.nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.nodeGroup.classList.add('nodes');
        
        // Add groups to transform group in correct order (links, labels, nodes)
        this.transformGroup.appendChild(this.linkGroup);
        this.transformGroup.appendChild(this.labelGroup);
        this.transformGroup.appendChild(this.nodeGroup);
        
        this.svg.appendChild(this.transformGroup);
        
        // Create arrowhead marker
        this.createArrowMarker();
        
        this.canvas.appendChild(this.svg);
    }

    /**
     * Create arrowhead marker for links
     */
    createArrowMarker() {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', `arrowhead-${this.containerId}`);
        marker.setAttribute('viewBox', '0 -5 10 10');
        marker.setAttribute('refX', '8');
        marker.setAttribute('refY', '0');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('markerUnits', 'strokeWidth');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0,-5L10,0L0,5');
        path.setAttribute('fill', '#5a5a5a');
        
        marker.appendChild(path);
        defs.appendChild(marker);
        this.svg.appendChild(defs);
    }

    /**
     * Setup text measurement utilities
     */
    setupTextMeasurement() {
        this.textCanvas = document.createElement('canvas');
        this.textContext = this.textCanvas.getContext('2d');
        this.textContext.font = '14px Arial';
    }

    /**
     * Measure text width for dynamic node sizing
     */
    measureTextWidth(text) {
        if (!this.textContext) return text.length * 8; // Fallback
        return this.textContext.measureText(text).width;
    }

    /**
     * Create SVG elements for all nodes and links
     */
    createElements(nodes, links) {
        this.clearElements();
        this.createLinkElements(links);
        this.createNodeElements(nodes);
    }

    /**
     * Create SVG elements for links
     */
    createLinkElements(links) {
        links.forEach(link => {
            const linkEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            linkEl.classList.add('link');
            linkEl.setAttribute('marker-end', `url(#arrowhead-${this.containerId})`);
            
            // Apply link styling
            if (link.weight) {
                linkEl.style.strokeWidth = `${link.weight}px`;
            }
            if (link.line_type === 'dashed') {
                linkEl.style.strokeDasharray = '5, 5';
            } else if (link.line_type === 'dotted') {
                linkEl.style.strokeDasharray = '2, 2';
            }
            
            this.linkGroup.appendChild(linkEl);

            // Create label background rectangle for better readability
            const labelBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            labelBackground.classList.add('edge-label-background');
            this.labelGroup.appendChild(labelBackground);
            
            const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            labelText.textContent = link.label || '';
            labelText.classList.add('edge-label-text');
            this.labelGroup.appendChild(labelText);
            
            this.linkElements.set(link, { linkEl, labelText, labelBackground });
        });
    }

    /**
     * Create SVG elements for nodes
     */
    createNodeElements(nodes) {
        const nodesArray = Array.from(nodes.values());
        
        nodesArray.forEach(node => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('data-id', node.data.id);
            
            const { shapeElement, hiddenIndicator } = this.createNodeShape(node);
            const textElement = this.createNodeText(node);
            
            // Assemble node group
            if (hiddenIndicator) {
                group.appendChild(hiddenIndicator);
            }
            group.appendChild(shapeElement);
            group.appendChild(textElement);
            
            this.nodeGroup.appendChild(group);
            this.nodeElements.set(node, { 
                group, 
                shape: shapeElement, 
                text: textElement,
                hiddenIndicator 
            });
        });
    }

    /**
     * Create shape element for a node based on its shape type
     */
    createNodeShape(node) {
        let shapeElement;
        let hiddenIndicator = null;
        
        switch(node.data.shape) {
            case 'rectangle':
                const textWidth = this.measureTextWidth(node.data.name);
                const padding = 20;
                const minWidth = node.size * 2;
                const rectWidth = Math.max(minWidth, textWidth + padding);
                const rectHeight = node.size * 1.4;
                
                // Store dynamic dimensions on node
                node.dynamicWidth = rectWidth;
                node.dynamicHeight = rectHeight;
                
                // Create hidden connection indicator
                const indicatorPadding = 4;
                hiddenIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                hiddenIndicator.setAttribute('x', -(rectWidth + indicatorPadding) / 2);
                hiddenIndicator.setAttribute('y', -(rectHeight + indicatorPadding) / 2);
                hiddenIndicator.setAttribute('width', rectWidth + indicatorPadding);
                hiddenIndicator.setAttribute('height', rectHeight + indicatorPadding);
                hiddenIndicator.setAttribute('rx', 5);
                hiddenIndicator.classList.add('hidden-connection-indicator');
                hiddenIndicator.style.display = 'none';
                
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shapeElement.setAttribute('x', -rectWidth / 2);
                shapeElement.setAttribute('y', -rectHeight / 2);
                shapeElement.setAttribute('width', rectWidth);
                shapeElement.setAttribute('height', rectHeight);
                shapeElement.setAttribute('rx', 5);
                break;
                
            case 'square':
                const squareSize = node.size * 1.4;
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shapeElement.setAttribute('x', -squareSize / 2);
                shapeElement.setAttribute('y', -squareSize / 2);
                shapeElement.setAttribute('width', squareSize);
                shapeElement.setAttribute('height', squareSize);
                shapeElement.setAttribute('rx', 5);
                break;
                
            case 'triangle':
                const triangleSize = node.size * 1.4;
                const h = triangleSize * Math.sqrt(3) / 2;
                const points = [
                    [0, -h / 2],
                    [-triangleSize / 2, h / 2],
                    [triangleSize / 2, h / 2]
                ].map(point => point.join(',')).join(' ');
                
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                shapeElement.setAttribute('points', points);
                break;
                
            default: // circle
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                shapeElement.setAttribute('r', node.size);
                break;
        }
        
        // Apply node styling
        shapeElement.classList.add('node');
        shapeElement.classList.add(`node-${node.data.type}`);
        shapeElement.setAttribute('data-type', node.data.type);
        
        return { shapeElement, hiddenIndicator };
    }

    /**
     * Create text element for a node
     */
    createNodeText(node) {
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.textContent = node.data.name;
        textElement.classList.add('node-label');
        textElement.setAttribute('text-anchor', 'middle');
        textElement.setAttribute('dominant-baseline', 'central');
        
        return textElement;
    }

    /**
     * Update positions of all elements during animation
     */
    render(nodes, links, filteredNodes = null) {
        // Update transform for pan/zoom
        this.transformGroup.style.transform = 
            `translate(${this.transformState.x}px, ${this.transformState.y}px) scale(${this.transformState.scale})`;

        // Update link positions
        this.updateLinkPositions(links, filteredNodes);
        
        // Update node positions and visibility
        this.updateNodePositions(nodes, filteredNodes);
    }

    /**
     * Update link positions and edge intersections
     */
    updateLinkPositions(links, filteredNodes = null) {
        links.forEach(link => {
            const elements = this.linkElements.get(link);
            if (!elements) return;
            
            // Handle filtering visibility for links
            const isVisible = !filteredNodes || 
                (filteredNodes.has(link.source.data.id) && filteredNodes.has(link.target.data.id));
            
            elements.linkEl.style.opacity = isVisible ? '1' : '0.1';
            elements.labelText.style.opacity = isVisible ? '1' : '0.1';
            elements.labelBackground.style.opacity = isVisible ? '1' : '0.1';
            
            const sourcePos = link.source.position;
            const targetPos = link.target.position;
            const diff = targetPos.subtract(sourcePos);
            const distance = diff.magnitude();
            
            let newX2 = targetPos.x;
            let newY2 = targetPos.y;
            
            // Calculate edge intersection based on target shape
            if (link.target.data.shape === 'rectangle' && distance > 0) {
                const halfWidth = (link.target.dynamicWidth || link.target.size * 2.8) / 2;
                const halfHeight = (link.target.dynamicHeight || link.target.size * 1.4) / 2;
                
                const angle = Math.atan2(diff.y, diff.x);
                const absAngle = Math.abs(angle);
                
                let dx = halfWidth;
                let dy = halfHeight;
                
                if (absAngle > Math.atan2(halfHeight, halfWidth) && 
                    absAngle < Math.PI - Math.atan2(halfHeight, halfWidth)) {
                    dx = halfHeight / Math.tan(absAngle);
                } else {
                    dy = halfWidth * Math.tan(absAngle);
                }
                
                newX2 = targetPos.x - dx * Math.sign(diff.x);
                newY2 = targetPos.y - dy * Math.sign(diff.y);
            } else if (link.target.data.shape === 'circle' && distance > link.target.size) {
                const ratio = (distance - link.target.size) / distance;
                newX2 = sourcePos.x + diff.x * ratio;
                newY2 = sourcePos.y + diff.y * ratio;
            }

            // Update link line
            elements.linkEl.setAttribute('x1', sourcePos.x);
            elements.linkEl.setAttribute('y1', sourcePos.y);
            elements.linkEl.setAttribute('x2', newX2);
            elements.linkEl.setAttribute('y2', newY2);

            // Update label position
            const midX = (sourcePos.x + newX2) / 2;
            const midY = (sourcePos.y + newY2) / 2;
            elements.labelText.setAttribute('x', midX);
            elements.labelText.setAttribute('y', midY);
            
            // Update label background
            this.updateLabelBackground(elements.labelText, elements.labelBackground);
        });
    }

    /**
     * Update label background size and position
     */
    updateLabelBackground(labelText, labelBackground) {
        if (!labelBackground || !labelText.textContent) return;
        
        try {
            const textBBox = labelText.getBBox();
            const padding = 4;
            
            labelBackground.setAttribute('x', textBBox.x - padding);
            labelBackground.setAttribute('y', textBBox.y - padding);
            labelBackground.setAttribute('width', textBBox.width + padding * 2);
            labelBackground.setAttribute('height', textBBox.height + padding * 2);
        } catch (error) {
            // Handle getBBox errors in some browsers
            console.warn('Could not get text bounding box:', error);
        }
    }

    /**
     * Update node positions and visibility
     */
    updateNodePositions(nodes, filteredNodes = null) {
        Array.from(nodes.values()).forEach(node => {
            const elements = this.nodeElements.get(node);
            if (elements) {
                elements.group.setAttribute('transform', `translate(${node.position.x},${node.position.y})`);
                
                // Handle filtering visibility for nodes
                const isVisible = !filteredNodes || filteredNodes.has(node.data.id);
                elements.group.style.opacity = isVisible ? '1' : '0.1';
            }
        });
    }

    /**
     * Update transform state for pan/zoom
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
     * Update SVG dimensions on container resize
     */
    resize(width, height) {
        if (this.svg) {
            this.svg.setAttribute('width', width);
            this.svg.setAttribute('height', height);
        }
    }

    /**
     * Clear all SVG elements
     */
    clearElements() {
        // Clear groups
        this.linkGroup.innerHTML = '';
        this.labelGroup.innerHTML = '';
        this.nodeGroup.innerHTML = '';
        
        // Clear tracking maps
        this.nodeElements.clear();
        this.linkElements.clear();
    }

    /**
     * Get SVG element for external event binding
     */
    getSVGElement() {
        return this.svg;
    }

    /**
     * Get node elements map
     */
    getNodeElements() {
        return this.nodeElements;
    }

    /**
     * Get link elements map
     */
    getLinkElements() {
        return this.linkElements;
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        this.clearElements();
        this.canvas = null;
        this.svg = null;
        this.transformGroup = null;
        this.linkGroup = null;
        this.nodeGroup = null;
        this.labelGroup = null;
        this.textCanvas = null;
        this.textContext = null;
    }
}