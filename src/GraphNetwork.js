import { Vector } from './Vector.js';
import { Node } from './Node.js';
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { UIManager } from './ui/UIManager.js';
import { SVGRenderer } from './rendering/SVGRenderer.js';
import { EventManager } from './interaction/EventManager.js';

/**
 * GraphNetwork - Modern modular interactive SVG graph visualization library
 * 
 * Refactored from monolithic 1,588-line class into focused, maintainable modules:
 * - PhysicsEngine: Force calculations and position updates
 * - UIManager: Controls, settings, legend, and UI elements
 * - SVGRenderer: SVG creation, manipulation, and rendering
 * - EventManager: User interactions and event handling
 * 
 * This orchestrator class coordinates between modules and provides the public API.
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

        // Data storage
        this.nodes = new Map();
        this.links = [];
        this.filteredNodes = null;
        
        // Animation
        this.animationFrame = null;
        this.isAnimating = false;

        // Initialize modules
        this.initializeModules();
        
        // Load data if provided
        if (options.data) {
            this.setData(options.data);
        }
        
        this.startAnimation();
    }

    /**
     * Initialize all modular components
     */
    initializeModules() {
        // Initialize physics engine
        this.physics = new PhysicsEngine({
            damping: this.config.damping,
            repulsionStrength: this.config.repulsionStrength,
            attractionStrength: this.config.attractionStrength,
            groupingStrength: this.config.groupingStrength
        });

        // Initialize SVG renderer
        this.renderer = new SVGRenderer(this.container, this.containerId, this.config);
        this.renderer.initialize();

        // Initialize UI manager with callbacks
        const uiCallbacks = {
            onZoomIn: () => this.zoomIn(),
            onZoomOut: () => this.zoomOut(),
            onResetView: () => this.resetViewAndLayout(),
            onToggleTheme: () => this.toggleTheme(),
            onConfigChange: (key, value) => this.updatePhysicsConfig(key, value),
            onBreadcrumbClick: (action) => this.handleBreadcrumbAction(action)
        };
        
        this.ui = new UIManager(this.container, this.config, uiCallbacks);
        this.ui.initialize();

        // Initialize event manager with callbacks
        const eventCallbacks = {
            getNodeElements: () => this.renderer.getNodeElements(),
            fixNode: (node) => node.fix(),
            unfixNode: (node) => node.unfix(),
            filterByNode: (nodeId) => this.filterByNode(nodeId),
            resetFilter: () => this.resetFilter(),
            updateTransform: (x, y, scale) => this.renderer.setTransform(x, y, scale),
            showTooltip: (node, position) => this.showTooltip(node, position),
            hideTooltip: () => this.hideTooltip(),
            resize: () => this.handleResize()
        };
        
        this.events = new EventManager(this.config);
        // Note: events.initialize() will be called after SVG and nodes are ready
        
        // Create tooltip element
        this.createTooltip();
    }

    /**
     * Set graph data and create visual elements
     */
    setData(data) {
        this.clearGraph();
        this.parseData(data);
        this.renderer.createElements(this.nodes, this.links);
        
        // Initialize event handling after elements are created
        this.events.initialize(this.renderer.getSVGElement(), this.nodes, this.events.callbacks);
        
        // Update UI with new data
        this.ui.updateLegend(Array.from(this.nodes.values()));
        
        this.updateGraphView();
        this.emit('dataLoaded', { nodes: this.nodes.size, links: this.links.length });
    }

    /**
     * Parse and validate input data
     */
    parseData(data) {
        const { nodes, links } = data;
        
        // Validate and create nodes
        if (!Array.isArray(nodes)) {
            throw new Error('Data must contain a nodes array');
        }
        
        const rect = this.container.getBoundingClientRect();
        const containerWidth = rect.width || 800;
        const containerHeight = rect.height || 600;
        
        nodes.forEach(nodeData => {
            if (!nodeData.id || !nodeData.name) {
                throw new Error('Each node must have an id and name');
            }
            
            const node = new Node(nodeData, containerWidth, containerHeight);
            this.nodes.set(nodeData.id, node);
        });

        // Validate and create links
        if (!Array.isArray(links)) {
            throw new Error('Data must contain a links array');
        }
        
        links.forEach(linkData => {
            const sourceNode = this.nodes.get(linkData.source);
            const targetNode = this.nodes.get(linkData.target);
            
            if (!sourceNode || !targetNode) {
                throw new Error(`Link references non-existent node: ${linkData.source} -> ${linkData.target}`);
            }
            
            this.links.push({
                source: sourceNode,
                target: targetNode,
                label: linkData.label || '',
                weight: linkData.weight || 1,
                line_type: linkData.line_type || 'solid'
            });
        });
    }

    /**
     * Update physics configuration and notify physics engine
     */
    updatePhysicsConfig(key, value) {
        this.config[key] = value;
        this.physics.updateConfig({ [key]: value });
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.animate();
    }

    /**
     * Stop animation loop
     */
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    /**
     * Main animation loop - coordinates physics and rendering
     */
    animate() {
        if (!this.isAnimating) return;
        
        // Run physics simulation (unless panning)
        const transform = this.events.getTransform();
        if (!this.events.isPanning) {
            this.physics.updateForces(this.nodes, this.links, this.filteredNodes);
            this.physics.updatePositions(this.nodes, this.filteredNodes);
        }
        
        // Render current state
        this.renderer.render(this.nodes, this.links);
        
        // Schedule next frame
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Filter graph to show only specified node and its connections
     */
    filterByNode(nodeId, depth = null) {
        const filterDepth = depth !== null ? depth : this.config.filterDepth;
        const targetNode = this.nodes.get(nodeId);
        
        if (!targetNode) {
            throw new Error(`Node with id "${nodeId}" does not exist`);
        }
        
        const visibleNodes = new Set();
        const queue = [{ node: targetNode, currentDepth: 0 }];
        
        while (queue.length > 0) {
            const { node, currentDepth } = queue.shift();
            
            if (visibleNodes.has(node.data.id) || currentDepth > filterDepth) {
                continue;
            }
            
            visibleNodes.add(node.data.id);
            
            // Find connected nodes
            this.links.forEach(link => {
                if (link.source === node && !visibleNodes.has(link.target.data.id)) {
                    queue.push({ node: link.target, currentDepth: currentDepth + 1 });
                } else if (link.target === node && !visibleNodes.has(link.source.data.id)) {
                    queue.push({ node: link.source, currentDepth: currentDepth + 1 });
                }
            });
        }
        
        this.filteredNodes = visibleNodes;
        this.updateGraphView();
        
        // Update breadcrumbs
        const breadcrumbPath = [
            { name: 'All Nodes', action: 'reset' },
            { name: targetNode.data.name, action: null }
        ];
        this.ui.renderBreadcrumbs(breadcrumbPath);
        
        this.emit('filtered', { nodeId, depth: filterDepth, visibleNodes: Array.from(visibleNodes) });
    }

    /**
     * Reset filter to show all nodes
     */
    resetFilter() {
        this.filteredNodes = null;
        this.updateGraphView();
        
        const breadcrumbPath = [{ name: 'All Nodes', action: null }];
        this.ui.renderBreadcrumbs(breadcrumbPath);
        
        this.emit('filterReset');
    }

    /**
     * Update graph visibility based on current filter
     */
    updateGraphView() {
        // This would typically update CSS classes or visibility
        // For now, the filtering is handled in physics and rendering
        this.emit('viewUpdated', { 
            filteredNodes: this.filteredNodes ? Array.from(this.filteredNodes) : null 
        });
    }

    /**
     * Reset view and layout
     */
    resetViewAndLayout() {
        // Reset all nodes to new random positions
        const rect = this.container.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        
        this.nodes.forEach(node => {
            node.resetPosition(containerWidth, containerHeight);
        });
        
        // Reset view transform
        this.renderer.setTransform(0, 0, 1);
        this.events.setTransform(0, 0, 1);
        
        this.emit('reset');
    }

    /**
     * Zoom in
     */
    zoomIn() {
        const transform = this.events.getTransform();
        const newScale = Math.min(2.0, transform.scale * Math.pow(this.config.zoomSensitivity, 10));
        
        // Center zoom on container
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const scaleChange = newScale / transform.scale;
        const newX = centerX - (centerX - transform.x) * scaleChange;
        const newY = centerY - (centerY - transform.y) * scaleChange;
        
        this.renderer.setTransform(newX, newY, newScale);
        this.events.setTransform(newX, newY, newScale);
        
        this.emit('zoom', { scale: newScale, x: newX, y: newY });
    }

    /**
     * Zoom out
     */
    zoomOut() {
        const transform = this.events.getTransform();
        const newScale = Math.max(0.2, transform.scale / Math.pow(this.config.zoomSensitivity, 10));
        
        // Center zoom on container
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const scaleChange = newScale / transform.scale;
        const newX = centerX - (centerX - transform.x) * scaleChange;
        const newY = centerY - (centerY - transform.y) * scaleChange;
        
        this.renderer.setTransform(newX, newY, newScale);
        this.events.setTransform(newX, newY, newScale);
        
        this.emit('zoom', { scale: newScale, x: newX, y: newY });
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.config.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        this.config.theme = theme;
        this.container.setAttribute('data-theme', theme);
        this.ui.updateThemeToggle(theme);
        this.emit('themeChanged', { theme });
    }

    /**
     * Handle breadcrumb navigation
     */
    handleBreadcrumbAction(action) {
        if (action === 'reset') {
            this.resetFilter();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const rect = this.container.getBoundingClientRect();
        this.renderer.resize(rect.width, rect.height);
        this.emit('resize', { width: rect.width, height: rect.height });
    }

    /**
     * Create tooltip element
     */
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'graph-network-tooltip';
        this.tooltip.style.display = 'none';
        document.body.appendChild(this.tooltip);
    }

    /**
     * Show tooltip for node
     */
    showTooltip(node, position = null) {
        if (!this.tooltip) return;
        
        this.tooltip.innerHTML = `
            <strong>${node.data.name}</strong><br>
            Type: ${node.data.type}<br>
            Position: (${Math.round(node.position.x)}, ${Math.round(node.position.y)})
        `;
        
        if (position) {
            this.tooltip.style.left = `${position.x}px`;
            this.tooltip.style.top = `${position.y}px`;
        }
        
        this.tooltip.style.display = 'block';
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }

    /**
     * Clear all graph data
     */
    clearGraph() {
        this.nodes.clear();
        this.links = [];
        this.filteredNodes = null;
        this.renderer.clearElements();
    }

    /**
     * Get all nodes
     */
    getNodes() {
        return Array.from(this.nodes.values()).map(node => ({ ...node.data }));
    }

    /**
     * Get all links
     */
    getLinks() {
        return this.links.map(link => ({
            source: link.source.data.id,
            target: link.target.data.id,
            label: link.label,
            weight: link.weight,
            line_type: link.line_type
        }));
    }

    /**
     * Get node by ID
     */
    getNode(nodeId) {
        const node = this.nodes.get(nodeId);
        return node ? { ...node.data } : null;
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        this.events.on(event, callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        this.events.off(event, callback);
    }

    /**
     * Emit event
     */
    emit(event, data = {}) {
        this.events.emit(event, data);
    }

    /**
     * Clean up and destroy the graph
     */
    destroy() {
        this.stopAnimation();
        
        // Destroy modules
        this.physics = null;
        this.renderer?.destroy();
        this.ui?.destroy();
        this.events?.destroy();
        
        // Remove tooltip
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
        
        // Clear data
        this.clearGraph();
        
        this.emit('destroyed');
    }
}