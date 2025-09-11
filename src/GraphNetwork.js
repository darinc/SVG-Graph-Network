import { Vector } from './Vector.js';
import { Node } from './Node.js';

/**
 * GraphNetwork - Interactive SVG graph visualization library
 * 
 * @example
 * const graph = new GraphNetwork('container-id', {
 *   data: { nodes: [...], links: [...] },
 *   config: {
 *     damping: 0.95,
 *     repulsionStrength: 6500,
 *     showControls: true
 *   }
 * });
 */
export class GraphNetwork {
    /**
     * Safely set a class name on an element, avoiding readonly property issues
     */
    setElementClass(element, className) {
        try {
            element.className = className;
        } catch (error) {
            // Fallback to classList if className is readonly
            element.classList.add(className);
        }
    }

    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            throw new Error(`Container element with id "${containerId}" not found.`);
        }
        

        // Default configuration
        this.config = {
            damping: 0.95,
            repulsionStrength: 6500,
            attractionStrength: 0.001,
            zoomSensitivity: 1.01,
            filterDepth: 1,
            groupingStrength: 0.001,
            showControls: true,
            showLegend: true,
            showTitle: true,
            showBreadcrumbs: true,
            theme: 'dark',
            title: 'Graph Network',
            ...options.config
        };

        // Initialize state
        this.nodes = new Map();
        this.links = [];
        this.adjList = new Map();
        this.nodeElements = new Map();
        this.linkElements = new Map();
        this.filteredNodes = null;
        this.currentFilterNodeId = null;

        // Interaction state
        this.isDragging = false;
        this.dragNode = null;
        this.isPanning = false;
        this.lastMouse = { x: 0, y: 0 };
        this.transformState = { x: 0, y: 0, scale: 1 };
        
        // Touch interaction state
        this.isPinching = false;
        this.lastPinchDistance = 0;
        this.lastPinchCenter = { x: 0, y: 0 };
        this.touchStartTime = 0;
        this.lastTouchEndTime = 0;
        this.touchTarget = null;
        this.dragStartPosition = null;
        this.wasNodeFixed = false;

        // Initialize the graph
        this.setupContainer();
        if (options.data) {
            this.setData(options.data);
        }
        this.setupEventListeners();
        this.animate();
    }

    /**
     * Set up the container with all UI elements
     */
    setupContainer() {
        // Clean up any existing graph content (prevents duplication on HMR)
        this.container.innerHTML = '';
        
        // Use classList instead of className to avoid readonly issues
        this.container.classList.add('graph-network-container');
        this.container.setAttribute('data-theme', this.config.theme);

        const rect = this.container.getBoundingClientRect();
        this.containerWidth = rect.width;
        this.containerHeight = rect.height;
        this.containerCenterX = rect.width / 2;
        this.containerCenterY = rect.height / 2;

        // Create main canvas
        this.canvas = document.createElement('div');
        this.canvas.classList.add('graph-network-canvas');
        this.container.appendChild(this.canvas);

        // Create SVG
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.classList.add('graph-network-svg');
        this.canvas.appendChild(this.svg);

        // Create SVG definitions
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

        // Create transform group
        this.transformGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.transformGroup.id = 'transform-group';
        this.svg.appendChild(this.transformGroup);

        // Create groups for different elements
        this.linkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        this.transformGroup.appendChild(this.linkGroup);
        this.transformGroup.appendChild(this.nodeGroup);
        this.transformGroup.appendChild(this.labelGroup);

        // Create tooltip
        this.tooltip = document.createElement('div');
        this.setElementClass(this.tooltip, 'graph-network-tooltip');
        this.container.appendChild(this.tooltip);

        // Create UI elements
        this.createTitle();
        this.createBreadcrumbs();
        this.createLegend();
        this.createControls();
        this.createSettingsPanel();
    }

    /**
     * Create title element
     */
    createTitle() {
        if (!this.config.showTitle) return;
        
        this.titleElement = document.createElement('div');
        this.setElementClass(this.titleElement, 'graph-network-title');
        this.titleElement.textContent = this.config.title;
        this.container.appendChild(this.titleElement);
    }

    /**
     * Create breadcrumb navigation
     */
    createBreadcrumbs() {
        if (!this.config.showBreadcrumbs) return;
        
        this.viewInfo = document.createElement('div');
        this.setElementClass(this.viewInfo, 'graph-network-view-info');
        this.container.appendChild(this.viewInfo);
        this.renderBreadcrumbs(null);
    }

    /**
     * Generate legend items based on the actual node types in the data
     */
    generateLegendItems() {
        // Map of node types to their colors and display names
        const typeMapping = {
            // Historical/diplomatic types
            'major_power': { color: '#E53E3E', text: 'Major Powers' },
            'regional_power': { color: '#4299E1', text: 'Regional Powers' },
            'small_nation': { color: '#38A169', text: 'Small Nations' },
            'territory': { color: '#ED8936', text: 'Territories' },
            
            // Generic types
            'primary': { color: '#E53E3E', text: 'Primary Nodes' },
            'secondary': { color: '#4299E1', text: 'Secondary Nodes' },
            'tertiary': { color: '#38A169', text: 'Tertiary Nodes' },
            'auxiliary': { color: '#ED8936', text: 'Auxiliary Nodes' }
        };

        // Get unique node types from the actual data
        const nodeTypes = new Set();
        if (this.nodes) {
            this.nodes.forEach(node => {
                if (node.data && node.data.type) {
                    nodeTypes.add(node.data.type);
                }
            });
        }

        // Generate legend items for the types present in the data
        const legendItems = [];
        nodeTypes.forEach(type => {
            if (typeMapping[type]) {
                legendItems.push(typeMapping[type]);
            }
        });

        // Fallback to default items if no data is loaded yet
        if (legendItems.length === 0) {
            return [
                { color: '#E53E3E', text: 'Major Powers' },
                { color: '#4299E1', text: 'Regional Powers' },
                { color: '#38A169', text: 'Small Nations' },
                { color: '#ED8936', text: 'Territories' }
            ];
        }

        return legendItems;
    }

    /**
     * Update legend content based on current data
     */
    updateLegend() {
        if (!this.legend || !this.config.showLegend) return;

        // Find the legend content container
        const content = this.legend.querySelector('.graph-network-legend-content');
        if (!content) return;

        // Clear existing content
        content.innerHTML = '';

        // Generate new legend items based on current data
        const legendItems = this.generateLegendItems();

        legendItems.forEach(item => {
            const section = document.createElement('div');
            this.setElementClass(section, 'legend-section');
            
            const legendItem = document.createElement('div');
            this.setElementClass(legendItem, 'legend-item');
            
            const color = document.createElement('div');
            this.setElementClass(color, 'legend-color');
            color.style.backgroundColor = item.color;
            
            const text = document.createElement('span');
            this.setElementClass(text, 'legend-text');
            text.textContent = item.text;
            
            legendItem.appendChild(color);
            legendItem.appendChild(text);
            section.appendChild(legendItem);
            content.appendChild(section);
        });
    }

    /**
     * Create legend
     */
    createLegend() {
        if (!this.config.showLegend) return;
        
        this.legend = document.createElement('div');
        this.setElementClass(this.legend, 'graph-network-legend');
        
        const header = document.createElement('div');
        this.setElementClass(header, 'graph-network-legend-header');
        
        const title = document.createElement('h4');
        title.textContent = 'Legend';
        
        const toggle = document.createElement('button');
        this.setElementClass(toggle, 'graph-network-legend-toggle');
        toggle.textContent = '−';
        toggle.addEventListener('click', () => {
            const isMinimized = this.legend.classList.toggle('minimized');
            toggle.textContent = isMinimized ? '+' : '−';
        });
        
        header.appendChild(title);
        header.appendChild(toggle);
        
        const content = document.createElement('div');
        this.setElementClass(content, 'graph-network-legend-content');
        
        // Generate legend items based on actual node types in the data
        const legendItems = this.generateLegendItems();
        
        legendItems.forEach(item => {
            const section = document.createElement('div');
            this.setElementClass(section, 'legend-section');
            
            const legendItem = document.createElement('div');
            this.setElementClass(legendItem, 'legend-item');
            
            const color = document.createElement('div');
            this.setElementClass(color, 'legend-color');
            color.style.backgroundColor = item.color;
            
            const text = document.createElement('span');
            this.setElementClass(text, 'legend-text');
            text.textContent = item.text;
            
            legendItem.appendChild(color);
            legendItem.appendChild(text);
            section.appendChild(legendItem);
            content.appendChild(section);
        });
        
        this.legend.appendChild(header);
        this.legend.appendChild(content);
        this.container.appendChild(this.legend);
    }

    /**
     * Create control buttons
     */
    createControls() {
        if (!this.config.showControls) return;
        
        this.controls = document.createElement('div');
        this.setElementClass(this.controls, 'graph-network-controls');
        
        // Mobile zoom controls (hidden on desktop via CSS)
        this.mobileControls = document.createElement('div');
        this.setElementClass(this.mobileControls, 'graph-network-mobile-controls');
        
        // Zoom in button
        this.zoomInButton = document.createElement('button');
        this.setElementClass(this.zoomInButton, 'graph-network-zoom-button graph-network-zoom-in');
        this.zoomInButton.textContent = '+';
        this.zoomInButton.addEventListener('click', () => this.zoomIn());
        
        // Zoom out button
        this.zoomOutButton = document.createElement('button');
        this.setElementClass(this.zoomOutButton, 'graph-network-zoom-button graph-network-zoom-out');
        this.zoomOutButton.textContent = '−';
        this.zoomOutButton.addEventListener('click', () => this.zoomOut());
        
        // Reset view button
        this.resetButton = document.createElement('button');
        this.setElementClass(this.resetButton, 'graph-network-reset-view-button');
        this.resetButton.textContent = '⊙';
        this.resetButton.addEventListener('click', () => this.resetViewAndLayout());
        
        this.mobileControls.appendChild(this.zoomInButton);
        this.mobileControls.appendChild(this.zoomOutButton);
        this.mobileControls.appendChild(this.resetButton);
        
        // Theme toggle
        this.themeToggle = document.createElement('button');
        this.setElementClass(this.themeToggle, 'graph-network-theme-toggle');
        this.themeToggle.textContent = this.config.theme === 'light' ? '🌙' : '🌞';
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Settings toggle
        this.settingsToggle = document.createElement('button');
        this.setElementClass(this.settingsToggle, 'graph-network-settings-toggle');
        this.settingsToggle.textContent = '^';
        this.settingsToggle.addEventListener('click', () => this.toggleSettings());
        
        this.controls.appendChild(this.mobileControls);
        this.controls.appendChild(this.themeToggle);
        this.controls.appendChild(this.settingsToggle);
        this.container.appendChild(this.controls);
    }

    /**
     * Create settings panel
     */
    createSettingsPanel() {
        if (!this.config.showControls) return;
        
        this.settingsPanel = document.createElement('div');
        this.setElementClass(this.settingsPanel, 'graph-network-settings');
        
        const title = document.createElement('h3');
        title.textContent = 'Simulation Controls';
        this.settingsPanel.appendChild(title);
        
        // Create sliders for each configuration option
        const controls = [
            { id: 'damping', label: 'Damping', min: 0, max: 20, value: 10, step: 0.5 },
            { id: 'repulsion', label: 'Repulsion', min: 0, max: 20, value: 13, step: 0.5 },
            { id: 'attraction', label: 'Attraction', min: 0, max: 20, value: 10, step: 0.1 },
            { id: 'zoom-sensitivity', label: 'Zoom Sensitivity', min: 0.01, max: 2, value: 1.01, step: 0.01 },
            { id: 'filter-depth', label: 'Filter Depth', min: 1, max: 3, value: 1, step: 1 },
            { id: 'grouping', label: 'Grouping', min: 0, max: 20, value: 10, step: 0.5 }
        ];
        
        controls.forEach(control => {
            const group = document.createElement('div');
            this.setElementClass(group, 'control-group');
            
            const label = document.createElement('label');
            label.setAttribute('for', `${control.id}-slider-${this.containerId}`);
            label.innerHTML = `${control.label} (<span id="${control.id}-value-${this.containerId}">${control.value}</span>)`;
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.id = `${control.id}-slider-${this.containerId}`;
            slider.min = control.min;
            slider.max = control.max;
            slider.value = control.value;
            slider.step = control.step;
            
            slider.addEventListener('input', (e) => this.handleSliderChange(control.id, e.target.value));
            
            group.appendChild(label);
            group.appendChild(slider);
            this.settingsPanel.appendChild(group);
        });
        
        // Reset button
        const resetButton = document.createElement('button');
        this.setElementClass(resetButton, 'graph-network-reset-button');
        resetButton.textContent = 'Reset View & Layout';
        resetButton.addEventListener('click', () => this.resetViewAndLayout());
        
        this.settingsPanel.appendChild(resetButton);
        this.container.appendChild(this.settingsPanel);
    }

    /**
     * Handle slider changes
     */
    handleSliderChange(control, value) {
        const numValue = parseFloat(value);
        const valueElement = document.getElementById(`${control}-value-${this.containerId}`);
        
        switch (control) {
            case 'damping':
                if (numValue === 0) {
                    this.config.damping = 1.0;
                } else {
                    const t = numValue / 20;
                    this.config.damping = Math.exp(Math.log(1.0) * (1 - t) + Math.log(0.35) * t);
                }
                valueElement.textContent = numValue.toFixed(1);
                break;
            case 'repulsion':
                this.config.repulsionStrength = numValue * 500;
                valueElement.textContent = numValue.toFixed(1);
                break;
            case 'attraction':
                this.config.attractionStrength = numValue / 10000;
                valueElement.textContent = numValue.toFixed(1);
                break;
            case 'zoom-sensitivity':
                this.config.zoomSensitivity = numValue;
                valueElement.textContent = numValue.toFixed(2);
                break;
            case 'filter-depth':
                this.config.filterDepth = parseInt(numValue);
                valueElement.textContent = this.config.filterDepth;
                if (this.currentFilterNodeId) {
                    this.filterByNode(this.currentFilterNodeId, this.config.filterDepth);
                }
                break;
            case 'grouping':
                this.config.groupingStrength = numValue / 10000;
                valueElement.textContent = numValue.toFixed(1);
                break;
        }
    }

    /**
     * Toggle settings panel
     */
    toggleSettings() {
        const isOpen = this.settingsPanel.classList.toggle('is-open');
        this.settingsToggle.textContent = isOpen ? 'v' : '^';
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const currentTheme = this.config.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        this.config.theme = theme;
        this.container.setAttribute('data-theme', theme);
        if (this.themeToggle) {
            this.themeToggle.textContent = theme === 'light' ? '🌙' : '🌞';
        }
        this.emit('themeChanged', { theme });
    }

    /**
     * Set graph data
     */
    setData(data) {
        this.clearGraph();
        this.parseData(data);
        this.setupSVGElements();
        this.updateLegend(); // Update legend based on new data
        this.render();
    }

    /**
     * Parse graph data and create nodes and links
     */
    parseData(data) {
        // Create nodes from data
        data.nodes.forEach(nodeData => {
            const node = new Node(nodeData, this.containerWidth, this.containerHeight);
            this.nodes.set(nodeData.id, node);
            this.adjList.set(nodeData.id, []);
        });

        // Create links from data and build adjacency list
        data.links.forEach(linkData => {
            const sourceNode = this.nodes.get(linkData.source);
            const targetNode = this.nodes.get(linkData.target);
            if (sourceNode && targetNode) {
                const link = {
                    source: sourceNode,
                    target: targetNode,
                    label: linkData.label,
                    weight: linkData.weight,
                    line_type: linkData.line_type
                };
                this.links.push(link);
                this.adjList.get(linkData.source).push({ node: targetNode.data.id, link });
                this.adjList.get(linkData.target).push({ node: sourceNode.data.id, link });
            }
        });
    }

    /**
     * Measure text width for dynamic sizing
     */
    measureTextWidth(text) {
        const tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tempText.textContent = text;
        tempText.setAttribute('font-size', '14px');
        tempText.setAttribute('font-weight', 'bold');
        tempText.setAttribute('font-family', 'Inter, sans-serif');
        tempText.style.visibility = 'hidden';
        
        this.svg.appendChild(tempText);
        const width = tempText.getBBox().width;
        this.svg.removeChild(tempText);
        
        return width;
    }

    /**
     * Set up SVG elements for nodes and links
     */
    setupSVGElements() {
        const nodesArray = Array.from(this.nodes.values());

        // Create links
        this.links.forEach(link => {
            const linkEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            linkEl.classList.add('link');
            linkEl.setAttribute('marker-end', `url(#arrowhead-${this.containerId})`);
            
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
            labelText.textContent = link.label;
            labelText.classList.add('edge-label-text');
            this.labelGroup.appendChild(labelText);
            
            this.linkElements.set(link, { linkEl, labelText, labelBackground });
        });

        // Create nodes
        nodesArray.forEach(node => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('data-id', node.data.id);
            
            let shapeElement;
            let hiddenIndicator = null;
            
            switch(node.data.shape) {
                case 'rectangle':
                    const textWidth = this.measureTextWidth(node.data.name);
                    const padding = 20;
                    const minWidth = node.size * 2;
                    const rectWidth = Math.max(minWidth, textWidth + padding);
                    const rectHeight = node.size * 1.4;
                    
                    node.dynamicWidth = rectWidth;
                    node.dynamicHeight = rectHeight;
                    
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
                    const triPoints = [
                        `${0},${-triangleSize * 0.577}`, 
                        `${-triangleSize * 0.5},${triangleSize * 0.288}`, 
                        `${triangleSize * 0.5},${triangleSize * 0.288}`
                    ].join(' ');
                    shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    shapeElement.setAttribute('points', triPoints);
                    break;
                case 'circle':
                default:
                    shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    shapeElement.setAttribute('r', node.size);
                    break;
            }
            
            shapeElement.classList.add('node-shape', `node-${node.data.type}`);
            
            if (hiddenIndicator) {
                group.appendChild(hiddenIndicator);
            }
            group.appendChild(shapeElement);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.textContent = node.data.name;
            text.classList.add('node-text');
            text.setAttribute('dominant-baseline', 'central');
            group.appendChild(text);

            this.nodeGroup.appendChild(group);
            this.nodeElements.set(node, { group, shape: shapeElement, text, hiddenIndicator });
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Node events (delegated)
        this.nodeGroup.addEventListener('mousedown', (e) => {
            const nodeGroup = e.target.closest('g[data-id]');
            if (nodeGroup) {
                const nodeId = nodeGroup.getAttribute('data-id');
                const node = this.nodes.get(nodeId);
                this.handleNodeMouseDown(e, node);
            }
        });

        this.nodeGroup.addEventListener('dblclick', (e) => {
            const nodeGroup = e.target.closest('g[data-id]');
            if (nodeGroup) {
                const nodeId = nodeGroup.getAttribute('data-id');
                const node = this.nodes.get(nodeId);
                this.handleNodeDoubleClick(e, node);
            }
        });

        this.nodeGroup.addEventListener('mouseenter', (e) => {
            const nodeGroup = e.target.closest('g[data-id]');
            if (nodeGroup) {
                const nodeId = nodeGroup.getAttribute('data-id');
                const node = this.nodes.get(nodeId);
                this.showTooltip(node);
            }
        });

        this.nodeGroup.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });

        // SVG events
        this.svg.addEventListener('mousedown', (e) => this.handleSvgMouseDown(e));
        this.svg.addEventListener('mousemove', (e) => this.handleSvgMouseMove(e));
        this.svg.addEventListener('mouseup', () => this.handleSvgMouseUp());
        this.svg.addEventListener('dblclick', (e) => this.handleSvgDoubleClick(e));
        this.svg.addEventListener('wheel', (e) => this.handleWheel(e));

        // Touch events for mobile support
        this.svg.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.svg.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.svg.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.svg.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

        // Touch events for nodes
        this.nodeGroup.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            const nodeGroup = element?.closest('g[data-id]');
            if (nodeGroup) {
                const nodeId = nodeGroup.getAttribute('data-id');
                const node = this.nodes.get(nodeId);
                if (node) {
                    this.handleNodeTouchStart(e, node);
                }
            }
        }, { passive: false });

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Handle node mouse down (start dragging)
     */
    handleNodeMouseDown(e, node) {
        e.preventDefault();
        
        this.isDragging = true;
        this.dragNode = node;
        // Fix the node during dragging so physics doesn't interfere
        this.wasNodeFixed = node.isFixed;
        node.fix();
        
        this.emit('nodeMouseDown', { node, event: e });
    }

    /**
     * Handle node double click (filter/reset)
     */
    handleNodeDoubleClick(e, node) {
        e.preventDefault();
        
        if (this.currentFilterNodeId === node.data.id) {
            this.resetFilter();
        } else {
            this.filterByNode(node.data.id);
        }
        this.emit('nodeDoubleClick', { node, event: e });
    }

    /**
     * Handle SVG mouse down (start panning)
     */
    handleSvgMouseDown(e) {
        if (e.target.closest('.node-shape') || e.target.closest('.edge-label-text')) {
            return;
        }
        
        // Close settings panel if it's open
        if (this.settingsPanel && this.settingsPanel.classList.contains('is-open')) {
            this.settingsPanel.classList.remove('is-open');
            if (this.settingsToggle) {
                this.settingsToggle.textContent = '^';
            }
        }
        
        this.isPanning = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
        e.preventDefault();
    }

    /**
     * Handle SVG double click (reset filter when clicking background)
     */
    handleSvgDoubleClick(e) {
        if (e.target.closest('.node-shape') || e.target.closest('.edge-label-text')) {
            return;
        }
        
        // If we're in filter mode, reset to show all
        if (this.currentFilterNodeId) {
            this.resetFilter();
            e.preventDefault();
        }
    }

    /**
     * Handle SVG mouse move (dragging/panning)
     */
    handleSvgMouseMove(e) {
        if (this.isDragging && this.dragNode) {
            const rect = this.svg.getBoundingClientRect();
            const newX = (e.clientX - rect.left - this.transformState.x) / this.transformState.scale;
            const newY = (e.clientY - rect.top - this.transformState.y) / this.transformState.scale;
            
            
            this.dragNode.position.x = newX;
            this.dragNode.position.y = newY;
            this.showTooltip(this.dragNode);
            this.tooltip.style.left = `${e.clientX + 10}px`;
            this.tooltip.style.top = `${e.clientY + 10}px`;
        } else if (this.isPanning) {
            const dx = e.clientX - this.lastMouse.x;
            const dy = e.clientY - this.lastMouse.y;
            this.transformState.x += dx;
            this.transformState.y += dy;
            this.lastMouse = { x: e.clientX, y: e.clientY };
        }
    }

    /**
     * Handle SVG mouse up (stop dragging/panning)
     */
    handleSvgMouseUp() {
        if (this.isDragging && this.dragNode) {
            // Restore the node's original fixed state
            if (!this.wasNodeFixed) {
                this.dragNode.unfix();
            }
        }
        this.isDragging = false;
        this.dragNode = null;
        this.isPanning = false;
        this.wasNodeFixed = false;
    }

    /**
     * Handle mouse wheel (zooming)
     */
    handleWheel(e) {
        e.preventDefault();
        const rect = this.svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const oldScale = this.transformState.scale;
        const newScale = e.deltaY < 0 ? oldScale * this.config.zoomSensitivity : oldScale / this.config.zoomSensitivity;
        
        this.transformState.scale = Math.max(0.2, Math.min(2.0, newScale));

        this.transformState.x = mouseX - ((mouseX - this.transformState.x) * (this.transformState.scale / oldScale));
        this.transformState.y = mouseY - ((mouseY - this.transformState.y) * (this.transformState.scale / oldScale));
        
        this.emit('zoom', { scale: this.transformState.scale, x: this.transformState.x, y: this.transformState.y });
    }

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        e.preventDefault();
        const touches = Array.from(e.touches);
        
        // Always set touch time and track what was touched
        this.touchStartTime = Date.now();
        this.touchTarget = e.target;
        
        if (touches.length === 1) {
            // Single touch - handle like mouse down
            const touch = touches[0];
            
            if (e.target.closest('.node-shape') || e.target.closest('.edge-label-text')) {
                // Touch on node - let the node handler manage it
                console.log('Touch started on node element'); // Debug log
                // Don't set panning to true for node touches
                return;
            }
            
            // Close settings panel if it's open
            if (this.settingsPanel && this.settingsPanel.classList.contains('is-open')) {
                this.settingsPanel.classList.remove('is-open');
                if (this.settingsToggle) {
                    this.settingsToggle.textContent = '^';
                }
            }
            
            // Only set panning for background touches
            this.isPanning = true;
            this.lastMouse = { x: touch.clientX, y: touch.clientY };
        } else if (touches.length === 2) {
            // Two touches - prepare for pinch-to-zoom
            this.isPanning = false;
            this.isPinching = true;
            
            const touch1 = touches[0];
            const touch2 = touches[1];
            
            // Calculate initial distance between touches
            this.lastPinchDistance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) + 
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            
            // Calculate center point between touches
            this.lastPinchCenter = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
        }
    }

    /**
     * Handle node touch start (start dragging)
     */
    handleNodeTouchStart(e, node) {
        e.preventDefault();
        if (e.touches.length > 1) return;
        
        console.log('Node touch start:', node.data.name); // Debug log
        this.isDragging = true;
        this.dragNode = node;
        // Fix the node during dragging so physics doesn't interfere
        this.wasNodeFixed = node.isFixed;
        node.fix();
        // Store initial position to detect actual movement
        this.dragStartPosition = { x: node.position.x, y: node.position.y };
        // touchStartTime already set in handleTouchStart
        this.emit('nodeMouseDown', { node, event: e });
    }

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        e.preventDefault();
        const touches = Array.from(e.touches);
        
        if (touches.length === 1) {
            const touch = touches[0];
            
            if (this.isDragging && this.dragNode) {
                // Node dragging
                const rect = this.svg.getBoundingClientRect();
                this.dragNode.position.x = (touch.clientX - rect.left - this.transformState.x) / this.transformState.scale;
                this.dragNode.position.y = (touch.clientY - rect.top - this.transformState.y) / this.transformState.scale;
                this.showTooltip(this.dragNode);
                this.tooltip.style.left = `${touch.clientX + 10}px`;
                this.tooltip.style.top = `${touch.clientY + 10}px`;
            } else if (this.isPanning) {
                // Panning
                const dx = touch.clientX - this.lastMouse.x;
                const dy = touch.clientY - this.lastMouse.y;
                this.transformState.x += dx;
                this.transformState.y += dy;
                this.lastMouse = { x: touch.clientX, y: touch.clientY };
            }
        } else if (touches.length === 2 && this.isPinching) {
            // Pinch-to-zoom
            const touch1 = touches[0];
            const touch2 = touches[1];
            
            const currentDistance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) + 
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            
            const currentCenter = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
            
            // Calculate zoom change
            const scaleChange = currentDistance / this.lastPinchDistance;
            const oldScale = this.transformState.scale;
            const newScale = oldScale * scaleChange;
            
            this.transformState.scale = Math.max(0.2, Math.min(2.0, newScale));
            
            // Adjust position to zoom toward the center of the pinch
            const rect = this.svg.getBoundingClientRect();
            const zoomCenterX = currentCenter.x - rect.left;
            const zoomCenterY = currentCenter.y - rect.top;
            
            this.transformState.x = zoomCenterX - ((zoomCenterX - this.transformState.x) * (this.transformState.scale / oldScale));
            this.transformState.y = zoomCenterY - ((zoomCenterY - this.transformState.y) * (this.transformState.scale / oldScale));
            
            // Update for next frame
            this.lastPinchDistance = currentDistance;
            this.lastPinchCenter = currentCenter;
            
            this.emit('zoom', { scale: this.transformState.scale, x: this.transformState.x, y: this.transformState.y });
        }
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        e.preventDefault();
        const touchDuration = Date.now() - (this.touchStartTime || 0);
        const now = Date.now();
        
        // Check if node actually moved during drag (threshold of 5 pixels)
        const nodeActuallyMoved = this.isDragging && this.dragNode && this.dragStartPosition && 
            (Math.abs(this.dragNode.position.x - this.dragStartPosition.x) > 5 || 
             Math.abs(this.dragNode.position.y - this.dragStartPosition.y) > 5);
        
        console.log('Touch end - Duration:', touchDuration, 'ms, Dragging:', this.isDragging, 'Node moved:', nodeActuallyMoved, 'Panning:', this.isPanning); // Debug log
        
        // More lenient double-tap detection for mobile - don't count as dragging if node didn't actually move
        const isQuickTap = touchDuration < 500 && touchDuration > 50 && !nodeActuallyMoved && !this.isPanning && !this.isPinching;
        const isDoubleTap = this.lastTouchEndTime && (now - this.lastTouchEndTime) < 700;
        
        console.log('Is quick tap:', isQuickTap, 'Is double tap:', isDoubleTap); // Debug log
        
        if (isQuickTap) {
            if (isDoubleTap) {
                console.log('Double-tap detected!'); // Debug log
                
                // Use the original touch target for better reliability
                const targetElement = this.touchTarget || e.target || document.elementFromPoint(
                    e.changedTouches[0]?.clientX || 0, 
                    e.changedTouches[0]?.clientY || 0
                );
                
                const nodeGroup = targetElement?.closest('g[data-id]');
                console.log('Target element:', targetElement, 'Node group:', nodeGroup); // Debug log
                
                if (nodeGroup) {
                    // Double-tap on node - filter/reset like double-click
                    const nodeId = nodeGroup.getAttribute('data-id');
                    const node = this.nodes.get(nodeId);
                    if (node) {
                        console.log('Double-tap on node:', node.data.name); // Debug log
                        if (this.currentFilterNodeId === node.data.id) {
                            this.resetFilter();
                        } else {
                            this.filterByNode(node.data.id);
                        }
                        this.emit('nodeDoubleClick', { node, event: e });
                    }
                } else if (!targetElement?.closest('.graph-network-controls')) {
                    // Double-tap on background - reset filter (but not on controls)
                    console.log('Double-tap on background'); // Debug log
                    if (this.currentFilterNodeId) {
                        this.resetFilter();
                    }
                }
                
                // Clear the double-tap timer to prevent triple-tap issues
                this.lastTouchEndTime = 0;
            } else {
                // First tap - store timestamp for double-tap detection
                console.log('First tap registered'); // Debug log
                this.lastTouchEndTime = now;
            }
        } else {
            console.log('Not a quick tap - skipping double-tap detection'); // Debug log
        }
        
        // Clean up touch states
        if (e.touches.length === 0) {
            if (this.isDragging && this.dragNode) {
                // Restore the node's original fixed state
                if (!this.wasNodeFixed) {
                    this.dragNode.unfix();
                }
            }
            this.isDragging = false;
            this.dragNode = null;
            this.dragStartPosition = null;
            this.isPanning = false;
            this.isPinching = false;
            this.wasNodeFixed = false;
            this.hideTooltip();
        } else if (e.touches.length === 1) {
            // One finger still down - switch from pinch to pan
            this.isPinching = false;
            const touch = e.touches[0];
            this.isPanning = true;
            this.lastMouse = { x: touch.clientX, y: touch.clientY };
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const rect = this.container.getBoundingClientRect();
        this.containerWidth = rect.width;
        this.containerHeight = rect.height;
        this.containerCenterX = rect.width / 2;
        this.containerCenterY = rect.height / 2;
        this.emit('resize', { width: this.containerWidth, height: this.containerHeight });
    }

    /**
     * Show tooltip for a node
     */
    showTooltip(node) {
        this.tooltip.textContent = node.data.name;
        this.tooltip.style.opacity = 1;
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        this.tooltip.style.opacity = 0;
    }

    /**
     * Filter graph by node with given depth
     */
    filterByNode(nodeId, depth = null) {
        const filterDepth = depth !== null ? depth : this.config.filterDepth;
        const startNode = this.nodes.get(nodeId);
        if (!startNode) return;
        
        this.currentFilterNodeId = nodeId;
        
        const visibleNodes = new Set([startNode.data.id]);
        const pathMap = new Map();
        pathMap.set(startNode.data.id, null);

        const queue = [{ id: startNode.data.id, depth: 0 }];
        let head = 0;
        
        while (head < queue.length) {
            const { id, depth } = queue[head++];
            if (depth >= filterDepth) continue;
            
            this.adjList.get(id).forEach(neighbor => {
                if (!visibleNodes.has(neighbor.node)) {
                    visibleNodes.add(neighbor.node);
                    pathMap.set(neighbor.node, id);
                    queue.push({ id: neighbor.node, depth: depth + 1 });
                }
            });
        }

        this.filteredNodes = visibleNodes;
        this.updateGraphView();
        this.renderBreadcrumbs([nodeId]);
        this.emit('filtered', { nodeId, depth: filterDepth, visibleNodes: Array.from(visibleNodes) });
    }

    /**
     * Reset filter to show all nodes
     */
    resetFilter() {
        this.filteredNodes = null;
        this.currentFilterNodeId = null;
        this.updateGraphView();
        this.renderBreadcrumbs(null);
        this.emit('filterReset');
    }

    /**
     * Update graph view based on current filter
     */
    updateGraphView() {
        const nodesToDisplay = this.filteredNodes;
        
        this.nodes.forEach(node => {
            const isVisible = !nodesToDisplay || nodesToDisplay.has(node.data.id);
            const elements = this.nodeElements.get(node);
            elements.group.style.display = isVisible ? 'block' : 'none';

            if (isVisible && elements.hiddenIndicator) {
                let hasHiddenLink = false;
                this.adjList.get(node.data.id).forEach(neighbor => {
                    if (nodesToDisplay && !nodesToDisplay.has(neighbor.node)) {
                        hasHiddenLink = true;
                    }
                });
                elements.hiddenIndicator.style.display = hasHiddenLink ? 'block' : 'none';
            } else if (elements.hiddenIndicator) {
                elements.hiddenIndicator.style.display = 'none';
            }
        });
        
        this.links.forEach(link => {
            const isVisible = !nodesToDisplay || 
                (nodesToDisplay.has(link.source.data.id) && nodesToDisplay.has(link.target.data.id));
            const elements = this.linkElements.get(link);
            elements.linkEl.style.display = isVisible ? 'block' : 'none';
            elements.labelText.style.display = isVisible ? 'block' : 'none';
            if (elements.labelBackground) {
                elements.labelBackground.style.display = isVisible ? 'block' : 'none';
            }
        });
    }

    /**
     * Render breadcrumb navigation
     */
    renderBreadcrumbs(path) {
        if (!this.viewInfo) return;
        
        this.viewInfo.innerHTML = '';

        const allLink = document.createElement('a');
        allLink.textContent = 'All';
        allLink.href = '#';
        allLink.classList.add('breadcrumb-link');
        allLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.resetFilter();
        });
        this.viewInfo.appendChild(allLink);

        if (path && path.length > 0) {
            path.forEach(nodeId => {
                this.viewInfo.appendChild(document.createTextNode(' > '));
                const nodeName = this.nodes.get(nodeId).data.name;
                const link = document.createElement('a');
                link.textContent = nodeName;
                link.href = '#';
                link.classList.add('breadcrumb-link');
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.filterByNode(nodeId);
                });
                this.viewInfo.appendChild(link);
            });
        }
    }

    /**
     * Reset view and layout
     */
    resetViewAndLayout() {
        // Reset all node positions
        Array.from(this.nodes.values()).forEach(node => {
            node.resetPosition(this.containerWidth, this.containerHeight);
        });

        // Reset transform state
        this.transformState = { x: 0, y: 0, scale: 1 };

        // Reset filter
        this.resetFilter();
        
        this.emit('reset');
    }

    /**
     * Zoom in programmatically (for mobile controls)
     */
    zoomIn() {
        const centerX = this.containerWidth / 2;
        const centerY = this.containerHeight / 2;
        const oldScale = this.transformState.scale;
        const newScale = Math.min(2.0, oldScale * this.config.zoomSensitivity * 10);
        
        this.transformState.scale = newScale;
        this.transformState.x = centerX - ((centerX - this.transformState.x) * (this.transformState.scale / oldScale));
        this.transformState.y = centerY - ((centerY - this.transformState.y) * (this.transformState.scale / oldScale));
        
        this.emit('zoom', { scale: this.transformState.scale, x: this.transformState.x, y: this.transformState.y });
    }

    /**
     * Zoom out programmatically (for mobile controls)
     */
    zoomOut() {
        const centerX = this.containerWidth / 2;
        const centerY = this.containerHeight / 2;
        const oldScale = this.transformState.scale;
        const newScale = Math.max(0.2, oldScale / (this.config.zoomSensitivity * 10));
        
        this.transformState.scale = newScale;
        this.transformState.x = centerX - ((centerX - this.transformState.x) * (this.transformState.scale / oldScale));
        this.transformState.y = centerY - ((centerY - this.transformState.y) * (this.transformState.scale / oldScale));
        
        this.emit('zoom', { scale: this.transformState.scale, x: this.transformState.x, y: this.transformState.y });
    }

    /**
     * Update physics forces
     */
    updateForces() {
        const nodesArray = Array.from(this.nodes.values());
        nodesArray.forEach(node => node.force = new Vector());

        for (let i = 0; i < nodesArray.length; i++) {
            for (let j = i + 1; j < nodesArray.length; j++) {
                const nodeA = nodesArray[i];
                const nodeB = nodesArray[j];
                
                if (this.filteredNodes && 
                    (!this.filteredNodes.has(nodeA.data.id) || !this.filteredNodes.has(nodeB.data.id))) {
                    continue;
                }

                const diff = nodeA.position.subtract(nodeB.position);
                const distance = diff.magnitude();
                
                if (distance === 0) continue;
                
                const repulsionForce = diff.normalize().multiply(this.config.repulsionStrength / (distance * distance));
                nodeA.force = nodeA.force.add(repulsionForce);
                nodeB.force = nodeB.force.subtract(repulsionForce);

                if (nodeA.data.type === nodeB.data.type && this.config.groupingStrength > 0) {
                    const attractionForce = diff.normalize().multiply(-this.config.groupingStrength * distance);
                    nodeA.force = nodeA.force.add(attractionForce);
                    nodeB.force = nodeB.force.subtract(attractionForce);
                }
            }
        }

        this.links.forEach(link => {
            if (this.filteredNodes && 
                (!this.filteredNodes.has(link.source.data.id) || !this.filteredNodes.has(link.target.data.id))) {
                return;
            }
            
            const diff = link.source.position.subtract(link.target.position);
            const distance = diff.magnitude();
            
            if (distance === 0) return;
            
            const attractionForce = diff.normalize().multiply(this.config.attractionStrength * distance);
            link.source.force = link.source.force.subtract(attractionForce);
            link.target.force = link.target.force.add(attractionForce);
        });
    }

    /**
     * Update node positions based on forces
     */
    updatePositions() {
        const dt = 1;
        const nodesArray = Array.from(this.nodes.values());
        

        nodesArray.forEach(node => {
            if (node.isFixed) return;
            if (this.filteredNodes && !this.filteredNodes.has(node.data.id)) return;
            
            node.velocity = node.velocity.add(node.force.multiply(dt));
            node.velocity = node.velocity.multiply(this.config.damping);
            node.position = node.position.add(node.velocity.multiply(dt));
        });
    }

    /**
     * Render the current state
     */
    render() {
        this.transformGroup.style.transform = 
            `translate(${this.transformState.x}px, ${this.transformState.y}px) scale(${this.transformState.scale})`;

        this.links.forEach(link => {
            const elements = this.linkElements.get(link);
            
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

            elements.linkEl.setAttribute('x1', sourcePos.x);
            elements.linkEl.setAttribute('y1', sourcePos.y);
            elements.linkEl.setAttribute('x2', newX2);
            elements.linkEl.setAttribute('y2', newY2);

            const midX = (sourcePos.x + newX2) / 2;
            const midY = (sourcePos.y + newY2) / 2;
            elements.labelText.setAttribute('x', midX);
            elements.labelText.setAttribute('y', midY);
            
            // Update label background position and size
            if (elements.labelBackground) {
                // Get text dimensions for background sizing
                const textBBox = elements.labelText.getBBox();
                const padding = 4;
                
                elements.labelBackground.setAttribute('x', textBBox.x - padding);
                elements.labelBackground.setAttribute('y', textBBox.y - padding);
                elements.labelBackground.setAttribute('width', textBBox.width + padding * 2);
                elements.labelBackground.setAttribute('height', textBBox.height + padding * 2);
            }
        });

        Array.from(this.nodes.values()).forEach(node => {
            const elements = this.nodeElements.get(node);
            elements.group.setAttribute('transform', `translate(${node.position.x},${node.position.y})`);
        });
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isPanning) {  // Allow physics during drag, but not during pan
            this.updateForces();
            this.updatePositions();
        }
        this.render();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Clear the graph
     */
    clearGraph() {
        this.nodes.clear();
        this.links.length = 0;
        this.adjList.clear();
        this.nodeElements.clear();
        this.linkElements.clear();
        this.filteredNodes = null;
        this.currentFilterNodeId = null;
        
        while (this.linkGroup.firstChild) {
            this.linkGroup.removeChild(this.linkGroup.firstChild);
        }
        while (this.nodeGroup.firstChild) {
            this.nodeGroup.removeChild(this.nodeGroup.firstChild);
        }
        while (this.labelGroup.firstChild) {
            this.labelGroup.removeChild(this.labelGroup.firstChild);
        }
    }

    /**
     * Destroy the graph and clean up
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.clearGraph();
        this.container.innerHTML = '';
        this.container.classList.remove('graph-network-container');
        this.container.removeAttribute('data-theme');
        
        this.emit('destroyed');
    }

    // Event system
    on(event, callback) {
        if (!this.events) this.events = {};
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (!this.events || !this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }

    // Public API methods
    
    /**
     * Add a node to the graph
     */
    addNode(nodeData) {
        const node = new Node(nodeData, this.containerWidth, this.containerHeight);
        this.nodes.set(nodeData.id, node);
        this.adjList.set(nodeData.id, []);
        // TODO: Add SVG element creation for new node
        this.emit('nodeAdded', { node });
    }

    /**
     * Remove a node from the graph
     */
    removeNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        // Remove all links connected to this node
        this.links = this.links.filter(link => 
            link.source.data.id !== nodeId && link.target.data.id !== nodeId
        );
        
        this.nodes.delete(nodeId);
        this.adjList.delete(nodeId);
        
        // TODO: Remove SVG elements
        this.emit('nodeRemoved', { nodeId });
    }

    /**
     * Get node by ID
     */
    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    /**
     * Get all nodes
     */
    getNodes() {
        return Array.from(this.nodes.values());
    }

    /**
     * Get all links
     */
    getLinks() {
        return [...this.links];
    }

    /**
     * Fit graph to view
     */
    fitToView() {
        if (this.nodes.size === 0) return;
        
        const positions = Array.from(this.nodes.values()).map(node => node.position);
        const minX = Math.min(...positions.map(p => p.x));
        const maxX = Math.max(...positions.map(p => p.x));
        const minY = Math.min(...positions.map(p => p.y));
        const maxY = Math.max(...positions.map(p => p.y));
        
        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;
        const graphCenterX = (minX + maxX) / 2;
        const graphCenterY = (minY + maxY) / 2;
        
        const scaleX = this.containerWidth / (graphWidth + 100);
        const scaleY = this.containerHeight / (graphHeight + 100);
        const scale = Math.min(scaleX, scaleY, 1);
        
        this.transformState.scale = scale;
        this.transformState.x = this.containerCenterX - graphCenterX * scale;
        this.transformState.y = this.containerCenterY - graphCenterY * scale;
        
        this.emit('fitted', { scale, x: this.transformState.x, y: this.transformState.y });
    }
}