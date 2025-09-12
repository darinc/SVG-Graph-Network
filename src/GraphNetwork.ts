import { Node } from './Node';
import { PhysicsEngine } from './physics/PhysicsEngine';
import { UIManager, UICallbacks, BreadcrumbItem } from './ui/UIManager';
import { SVGRenderer, RenderLink } from './rendering/SVGRenderer';
import { EventManager, EventManagerCallbacks } from './interaction/EventManager';
import {
    NodeData,
    LinkData,
    EdgeData,
    GraphData,
    GraphConfig,
    Position,
    EventCallback,
    NodeCreationOptions,
    EdgeCreationOptions,
    DeletionOptions,
    BulkUpdateOptions,
    DataReplacementOptions,
    DataMergeOptions,
    TransactionState,
    TransactionOperation,
    NodeUpdate,
    LinkUpdate,
    DEFAULT_CONFIG,
    isGraphData,
    isNodeData,
    isLinkData
} from './types/index';
import {
    NodeValidationError,
    NodeExistsError,
    NodeNotFoundError,
    EdgeValidationError,
    EdgeExistsError,
    EdgeNotFoundError,
    InvalidEdgeReferencesError,
    GraphErrorUtils
} from './errors/GraphErrors';

/**
 * Graph initialization options
 */
export interface GraphNetworkOptions {
    /** Graph data containing nodes and links */
    data?: GraphData;
    /** Graph configuration */
    config?: Partial<GraphConfig>;
    /** Initial theme */
    theme?: 'light' | 'dark';
    /** Enable debug logging */
    debug?: boolean;
}

/**
 * Graph statistics and metrics
 */
export interface GraphStats {
    nodeCount: number;
    linkCount: number;
    visibleNodeCount: number;
    filteredNodeId: string | null;
    filterDepth: number;
    isAnimating: boolean;
    fps?: number;
    lastUpdateTime?: number;
}

/**
 * Tooltip configuration
 */
export interface TooltipConfig {
    enabled: boolean;
    showPosition: boolean;
    showType: boolean;
    customFields?: string[];
    formatter?: (node: Node) => string;
}

/**
 * Export format options
 */
export interface ExportOptions {
    format: 'json' | 'csv' | 'svg' | 'png';
    includeMetadata?: boolean;
    filename?: string;
}

/**
 * GraphNetwork - Modern modular interactive SVG graph visualization library
 *
 * Enhanced with full TypeScript support, comprehensive API, and modular architecture.
 * Orchestrates physics simulation, rendering, UI management, and user interactions.
 *
 * @example
 * ```typescript
 * const graph = new GraphNetwork<MyNodeType>('container-id', {
 *   data: { nodes: [...], links: [...] },
 *   config: {
 *     damping: 0.95,
 *     repulsionStrength: 6500,
 *     showControls: true
 *   }
 * });
 * ```
 */
export class GraphNetwork<T extends NodeData = NodeData> {
    private readonly containerId: string;
    private readonly container: HTMLElement;
    private readonly config: GraphConfig;

    // Core data storage
    private readonly nodes = new Map<string, Node<T>>();
    private links: RenderLink<T>[] = [];
    private readonly edges = new Map<string, LinkData>(); // Track edges by ID for Phase 3 API
    private filteredNodes: Set<string> | null = null;
    private currentFilterNodeId: string | null = null;
    
    // Transaction management (Phase 4)
    private currentTransaction: TransactionState | null = null;
    private transactionIdCounter: number = 0;

    // Animation state
    private animationFrame: number | null = null;
    private isAnimating: boolean = false;
    private lastFrameTime: number = 0;
    private frameCount: number = 0;
    private fps: number = 0;

    // Module instances
    private physics: PhysicsEngine | null = null;
    private renderer: SVGRenderer | null = null;
    private ui: UIManager | null = null;
    private events: EventManager<T> | null = null;

    // Event handling
    private eventCallbacks: EventManagerCallbacks<T> = {};
    private readonly customEventListeners = new Map<string, EventCallback<any>[]>();

    // Tooltip system
    private tooltip: HTMLElement | null = null;
    private tooltipConfig: TooltipConfig = {
        enabled: true,
        showPosition: true,
        showType: true
    };

    // Debug and metrics
    private readonly debug: boolean;
    private startTime: number = Date.now();

    /**
     * Create a new GraphNetwork instance
     * @param containerId - DOM element ID to render the graph in
     * @param options - Configuration options
     */
    constructor(containerId: string, options: GraphNetworkOptions = {}) {
        this.containerId = containerId;
        this.container = this.findContainer(containerId);
        this.debug = options.debug || false;

        // Merge configuration with defaults
        this.config = {
            ...DEFAULT_CONFIG,
            ...options.config
        };

        if (this.debug) {
            console.log('GraphNetwork: Initializing with config:', this.config);
        }

        // Setup container
        this.setupContainer();

        // Initialize modules
        this.initializeModules();

        // Load data if provided
        if (options.data) {
            this.setData(options.data);
        }

        this.startAnimation();
    }

    /**
     * Find and validate container element
     * @private
     */
    private findContainer(containerId: string): HTMLElement {
        const container = document.getElementById(containerId);

        if (!container) {
            throw new Error(`Container element with id "${containerId}" not found.`);
        }

        return container;
    }

    /**
     * Setup container with proper CSS classes and attributes
     * @private
     */
    private setupContainer(): void {
        // Clean up any existing graph content (prevents duplication on HMR)
        this.container.innerHTML = '';

        // Add CSS classes and theme attribute
        this.container.classList.add('graph-network-container');
        this.container.setAttribute('data-theme', this.config.theme);
    }

    /**
     * Initialize all modular components
     * @private
     */
    private initializeModules(): void {
        // Initialize physics engine
        this.physics = new PhysicsEngine({
            damping: this.config.damping,
            repulsionStrength: this.config.repulsionStrength,
            attractionStrength: this.config.attractionStrength,
            groupingStrength: this.config.groupingStrength
        });

        if (this.debug) {
            console.log('GraphNetwork: Physics engine initialized');
        }

        // Initialize SVG renderer
        this.renderer = new SVGRenderer(this.container, this.containerId, {
            showLabels: true,
            debug: this.debug
        });
        this.renderer.initialize();

        if (this.debug) {
            console.log('GraphNetwork: SVG renderer initialized');
        }

        // Initialize UI manager with callbacks
        const uiCallbacks: UICallbacks = {
            onZoomIn: () => this.zoomIn(),
            onZoomOut: () => this.zoomOut(),
            onResetView: () => this.resetViewAndLayout(),
            onToggleTheme: () => this.toggleTheme(),
            onConfigChange: (key: string, value: any) => this.updatePhysicsConfig(key, value),
            onBreadcrumbClick: (action: string) => this.handleBreadcrumbAction(action)
        };

        this.ui = new UIManager(this.container, this.config, uiCallbacks);
        this.ui.initialize();

        if (this.debug) {
            console.log('GraphNetwork: UI manager initialized');
        }

        // Initialize event manager with callbacks
        this.eventCallbacks = {
            getNodeElements: () =>
                (this.renderer?.getNodeElements() as ReadonlyMap<Node<T>, any>) || new Map(),
            fixNode: (node: Node<T>) => node.fix(),
            unfixNode: (node: Node<T>) => node.unfix(),
            filterByNode: (nodeId: string) => {
                // If double-clicking the same filtered node, reset to all
                if (this.currentFilterNodeId === nodeId) {
                    this.resetFilter();
                } else {
                    this.filterByNode(nodeId);
                }
            },
            resetFilter: () => this.resetFilter(),
            updateTransform: (x: number, y: number, scale: number) =>
                this.renderer?.setTransform(x, y, scale),
            showTooltip: (node: Node<T>, position: Position) => this.showTooltip(node, position),
            hideTooltip: () => this.hideTooltip(),
            closeSettings: () => this.ui?.closeSettings(),
            resize: () => this.handleResize()
        };

        this.events = new EventManager<T>(this.config);
        // Note: events.initialize() will be called after SVG and nodes are ready

        // Create tooltip element
        this.createTooltip();

        // Set initial theme after all modules are initialized
        this.setTheme(this.config.theme);

        if (this.debug) {
            console.log('GraphNetwork: All modules initialized successfully');
        }
    }


    /**
     * Parse and validate input data
     * @private
     */
    private parseData(data: GraphData): void {
        const { nodes, links } = data;

        // Validate nodes
        if (!Array.isArray(nodes) || nodes.length === 0) {
            throw new Error('Data must contain a non-empty nodes array');
        }

        const rect = this.container.getBoundingClientRect();
        const containerWidth = rect.width || 800;
        const containerHeight = rect.height || 600;

        if (this.debug) {
            console.log(`GraphNetwork: Container dimensions: ${containerWidth}x${containerHeight}`);
        }

        // Create and validate nodes
        nodes.forEach((nodeData, index) => {
            if (!isNodeData(nodeData)) {
                throw new Error(
                    `Invalid node data at index ${index}. Must have id and name properties.`
                );
            }

            const node = new Node(nodeData as T, containerWidth, containerHeight);

            if (this.debug && index < 5) {
                // Log first 5 nodes
                console.log(
                    `GraphNetwork: Node ${nodeData.name} created at position: (${node.position.x.toFixed(2)}, ${node.position.y.toFixed(2)})`
                );
            }

            this.nodes.set(nodeData.id, node);
        });

        // Validate and create links
        if (!Array.isArray(links)) {
            throw new Error('Data must contain a links array');
        }

        links.forEach((linkData, index) => {
            if (!isLinkData(linkData)) {
                throw new Error(
                    `Invalid link data at index ${index}. Must have source and target properties.`
                );
            }

            const sourceNode = this.nodes.get(linkData.source);
            const targetNode = this.nodes.get(linkData.target);

            if (!sourceNode || !targetNode) {
                throw new Error(
                    `Link references non-existent node: ${linkData.source} -> ${linkData.target}`
                );
            }

            // Create render link
            this.links.push({
                source: sourceNode,
                target: targetNode,
                label: linkData.label || '',
                weight: linkData.weight || 1,
                line_type: linkData.line_type || 'solid'
            });

            // Also populate edges Map for Phase 3 API compatibility
            const edgeId = linkData.id || `${linkData.source}-${linkData.target}`;
            this.edges.set(edgeId, { 
                id: edgeId, 
                ...linkData 
            });
        });

        if (this.debug) {
            console.log(
                `GraphNetwork: Successfully parsed ${this.nodes.size} nodes and ${this.links.length} links`
            );
        }
    }

    /**
     * Update physics configuration and notify physics engine
     * @param key - Configuration key
     * @param value - New value
     */
    updatePhysicsConfig(key: string, value: any): void {
        (this.config as any)[key] = value;

        if (this.debug) {
            console.log(`GraphNetwork: Updated config ${key} = ${value}`);
        }

        // Handle filterDepth changes specially
        if (key === 'filterDepth') {
            // If we currently have a filter active, re-apply it with the new depth
            if (this.currentFilterNodeId) {
                this.filterByNode(this.currentFilterNodeId, value);
            }
        } else {
            // For physics parameters, update the physics engine
            this.physics?.updateConfig({ [key]: value });
        }
    }

    /**
     * Start animation loop
     */
    startAnimation(): void {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;

        if (this.debug) {
            console.log('GraphNetwork: Animation started');
        }

        this.animate();
    }

    /**
     * Stop animation loop
     */
    stopAnimation(): void {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        if (this.debug) {
            console.log('GraphNetwork: Animation stopped');
        }
    }

    /**
     * Main animation loop - coordinates physics and rendering
     * @private
     */
    private animate(): void {
        if (!this.isAnimating) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;

        // Calculate FPS every 60 frames
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.fps = Math.round(1000 / deltaTime);
        }

        // Ensure physics engine exists
        if (!this.physics) {
            console.error('GraphNetwork: Physics engine not initialized');
            return;
        }

        // Run physics simulation (unless panning)
        if (!this.events?.isPanning()) {
            const physicsLinks = PhysicsEngine.createLinks(
                this.links.map(link => ({
                    source: link.source.getId(),
                    target: link.target.getId(),
                    weight: link.weight
                })),
                this.nodes
            );

            this.physics.updateForces(this.nodes, physicsLinks, this.filteredNodes);
            this.physics.updatePositions(this.nodes, this.filteredNodes);
        }

        // Render current state
        this.renderer?.render(this.nodes, this.links, this.filteredNodes);

        this.lastFrameTime = currentTime;

        // Schedule next frame
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Filter graph to show only specified node and its connections
     * @param nodeId - ID of the node to filter by
     * @param depth - Connection depth (defaults to config.filterDepth)
     */
    filterByNode(nodeId: string, depth: number | null = null): void {
        const filterDepth = depth !== null ? depth : this.config.filterDepth;
        const targetNode = this.nodes.get(nodeId);

        if (!targetNode) {
            throw new Error(`Node with id "${nodeId}" does not exist`);
        }

        const visibleNodes = new Set<string>();
        const queue: Array<{ node: Node<T>; currentDepth: number }> = [
            { node: targetNode, currentDepth: 0 }
        ];

        while (queue.length > 0) {
            const item = queue.shift();
            if (!item) break;

            const { node, currentDepth } = item;

            if (visibleNodes.has(node.getId()) || currentDepth > filterDepth) {
                continue;
            }

            visibleNodes.add(node.getId());

            // Find connected nodes
            this.links.forEach(link => {
                if (link.source === node && !visibleNodes.has(link.target.getId())) {
                    queue.push({ node: link.target, currentDepth: currentDepth + 1 });
                } else if (link.target === node && !visibleNodes.has(link.source.getId())) {
                    queue.push({ node: link.source, currentDepth: currentDepth + 1 });
                }
            });
        }

        this.filteredNodes = visibleNodes;
        this.currentFilterNodeId = nodeId;
        this.updateGraphView();

        // Update breadcrumbs
        const breadcrumbPath: BreadcrumbItem[] = [
            { name: 'All Nodes', action: 'reset' },
            { name: targetNode.getName() }
        ];
        this.ui?.renderBreadcrumbs(breadcrumbPath);

        if (this.debug) {
            console.log(
                `GraphNetwork: Filtered to ${visibleNodes.size} nodes from node "${targetNode.getName()}" with depth ${filterDepth}`
            );
        }

        this.emit('filtered', {
            nodeId,
            depth: filterDepth,
            visibleNodes: Array.from(visibleNodes),
            nodeName: targetNode.getName()
        });
    }

    /**
     * Reset filter to show all nodes
     */
    resetFilter(): void {
        const hadFilter = this.filteredNodes !== null;

        this.filteredNodes = null;
        this.currentFilterNodeId = null;
        this.updateGraphView();

        const breadcrumbPath: BreadcrumbItem[] = [{ name: 'All Nodes' }];
        this.ui?.renderBreadcrumbs(breadcrumbPath);

        if (this.debug && hadFilter) {
            console.log('GraphNetwork: Filter reset - showing all nodes');
        }

        this.emit('filterReset', {
            previousFilterNodeId: this.currentFilterNodeId,
            totalNodes: this.nodes.size
        });
    }

    /**
     * Update graph visibility based on current filter
     * @private
     */
    private updateGraphView(): void {
        this.emit('viewUpdated', {
            filteredNodes: this.filteredNodes ? Array.from(this.filteredNodes) : null,
            totalNodes: this.nodes.size,
            visibleNodes: this.filteredNodes?.size || this.nodes.size
        });
    }

    /**
     * Reset all node positions to random locations
     */
    resetAllNodePositions(): void {
        const rect = this.container.getBoundingClientRect();
        const containerWidth = rect.width || 800;
        const containerHeight = rect.height || 600;

        this.nodes.forEach(node => {
            node.resetPosition(containerWidth, containerHeight);
        });

        if (this.debug) {
            console.log(`GraphNetwork: Reset positions for ${this.nodes.size} nodes`);
        }
    }

    /**
     * Reset view and layout
     */
    resetViewAndLayout(): void {
        // Reset all nodes to new random positions
        this.resetAllNodePositions();

        // Reset view transform
        this.renderer?.setTransform(0, 0, 1);
        this.events?.setTransform(0, 0, 1);

        if (this.debug) {
            console.log('GraphNetwork: View and layout reset');
        }

        this.emit('reset', {
            nodeCount: this.nodes.size,
            timestamp: Date.now()
        });
    }

    /**
     * Zoom in towards the center
     * @param factor - Zoom factor (defaults to config-based calculation)
     */
    zoomIn(factor?: number): void {
        const transform = this.events?.getTransform() || { x: 0, y: 0, scale: 1 };
        const zoomFactor = factor || Math.pow(this.config.zoomSensitivity, 10);
        const newScale = Math.min(2.0, transform.scale * zoomFactor);

        // Center zoom on container
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const scaleChange = newScale / transform.scale;
        const newX = centerX - (centerX - transform.x) * scaleChange;
        const newY = centerY - (centerY - transform.y) * scaleChange;

        this.renderer?.setTransform(newX, newY, newScale);
        this.events?.setTransform(newX, newY, newScale);

        this.emit('zoom', {
            scale: newScale,
            x: newX,
            y: newY,
            direction: 'in',
            factor: zoomFactor
        });
    }

    /**
     * Zoom out from the center
     * @param factor - Zoom factor (defaults to config-based calculation)
     */
    zoomOut(factor?: number): void {
        const transform = this.events?.getTransform() || { x: 0, y: 0, scale: 1 };
        const zoomFactor = factor || Math.pow(this.config.zoomSensitivity, 10);
        const newScale = Math.max(0.2, transform.scale / zoomFactor);

        // Center zoom on container
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const scaleChange = newScale / transform.scale;
        const newX = centerX - (centerX - transform.x) * scaleChange;
        const newY = centerY - (centerY - transform.y) * scaleChange;

        this.renderer?.setTransform(newX, newY, newScale);
        this.events?.setTransform(newX, newY, newScale);

        this.emit('zoom', {
            scale: newScale,
            x: newX,
            y: newY,
            direction: 'out',
            factor: zoomFactor
        });
    }

    /**
     * Zoom to fit all nodes in the viewport
     * @param padding - Padding around the content (default: 50px)
     */
    zoomToFit(padding: number = 50): void {
        if (!this.renderer || this.nodes.size === 0) return;

        const bounds = this.renderer.getBounds(this.nodes, this.filteredNodes);
        const rect = this.container.getBoundingClientRect();

        if (bounds.width === 0 || bounds.height === 0) return;

        const scaleX = (rect.width - padding * 2) / bounds.width;
        const scaleY = (rect.height - padding * 2) / bounds.height;
        const scale = Math.min(Math.max(0.2, Math.min(scaleX, scaleY)), 2.0);

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const boundsX = bounds.x + bounds.width / 2;
        const boundsY = bounds.y + bounds.height / 2;

        const x = centerX - boundsX * scale;
        const y = centerY - boundsY * scale;

        this.renderer.setTransform(x, y, scale);
        this.events?.setTransform(x, y, scale);

        if (this.debug) {
            console.log(`GraphNetwork: Zoom to fit - scale: ${scale.toFixed(2)}, bounds:`, bounds);
        }

        this.emit('zoom', {
            scale,
            x,
            y,
            direction: 'fit',
            bounds
        });
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme(): void {
        const newTheme: 'light' | 'dark' = this.config.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Set theme
     * @param theme - Theme to set
     */
    setTheme(theme: 'light' | 'dark'): void {
        this.config.theme = theme;
        this.container.setAttribute('data-theme', theme);
        this.ui?.updateThemeToggle(theme);

        if (this.debug) {
            console.log(`GraphNetwork: Theme changed to ${theme}`);
        }

        this.emit('themeChanged', { theme });
    }

    /**
     * Handle breadcrumb navigation
     * @private
     */
    private handleBreadcrumbAction(action: string): void {
        if (action === 'reset') {
            this.resetFilter();
        }
    }

    /**
     * Handle window resize
     * @private
     */
    private handleResize(): void {
        const rect = this.container.getBoundingClientRect();
        this.renderer?.resize(rect.width, rect.height);

        if (this.debug) {
            console.log(`GraphNetwork: Resized to ${rect.width}x${rect.height}`);
        }

        this.emit('resize', { width: rect.width, height: rect.height });
    }

    /**
     * Create tooltip element
     * @private
     */
    private createTooltip(): void {
        if (!this.tooltipConfig.enabled) return;

        this.tooltip = document.createElement('div');
        this.tooltip.className = 'graph-network-tooltip';
        this.tooltip.style.display = 'none';
        this.tooltip.style.pointerEvents = 'none';
        document.body.appendChild(this.tooltip);
    }

    /**
     * Show tooltip for node
     * @param node - Node to show tooltip for
     * @param position - Screen position for tooltip
     */
    showTooltip(node: Node<T>, position: Position | null = null): void {
        if (!this.tooltip || !this.tooltipConfig.enabled) return;

        let content: string;

        if (this.tooltipConfig.formatter) {
            content = this.tooltipConfig.formatter(node);
        } else {
            const parts: string[] = [`<strong>${node.getName()}</strong>`];

            if (this.tooltipConfig.showType && node.getType()) {
                parts.push(`Type: ${node.getType()}`);
            }

            if (this.tooltipConfig.showPosition) {
                parts.push(
                    `Position: (${Math.round(node.position.x)}, ${Math.round(node.position.y)})`
                );
            }

            if (this.tooltipConfig.customFields) {
                this.tooltipConfig.customFields.forEach(field => {
                    const value = (node.data as any)[field];
                    if (value !== undefined) {
                        parts.push(`${field}: ${value}`);
                    }
                });
            }

            content = parts.join('<br>');
        }

        this.tooltip.innerHTML = content;

        if (position) {
            this.tooltip.style.left = `${position.x}px`;
            this.tooltip.style.top = `${position.y}px`;
        }

        this.tooltip.style.display = 'block';
    }

    /**
     * Hide tooltip
     */
    hideTooltip(): void {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }

    /**
     * Configure tooltip behavior
     * @param config - Tooltip configuration
     */
    configureTooltip(config: Partial<TooltipConfig>): void {
        this.tooltipConfig = { ...this.tooltipConfig, ...config };

        if (!config.enabled && this.tooltip) {
            this.hideTooltip();
        }
    }

    /**
     * Clear all graph data
     */
    clearGraph(): void {
        this.nodes.clear();
        this.links = [];
        this.edges.clear(); // Clear edge tracking for Phase 3 API
        this.filteredNodes = null;
        this.currentFilterNodeId = null;
        this.renderer?.clearElements();

        if (this.debug) {
            console.log('GraphNetwork: Graph data cleared');
        }
    }

    /**
     * Add a single node to the graph with enhanced validation and positioning options
     * @param nodeData - Node data to add
     * @param options - Creation options including initial position
     */
    addNode(nodeData: T, options: NodeCreationOptions = {}): Node<T> {
        try {
            // Enhanced validation
            if (!options.skipValidation) {
                if (!isNodeData(nodeData)) {
                    throw new NodeValidationError(
                        'Invalid node data. Must have id and name properties.',
                        nodeData
                    );
                }

                // Additional validation for required fields
                if (!nodeData.id || typeof nodeData.id !== 'string' || nodeData.id.trim() === '') {
                    throw new NodeValidationError('Node id must be a non-empty string', nodeData);
                }

                if (!nodeData.name || typeof nodeData.name !== 'string' || nodeData.name.trim() === '') {
                    throw new NodeValidationError('Node name must be a non-empty string', nodeData);
                }

                // Validate optional fields
                if (nodeData.type !== undefined && typeof nodeData.type !== 'string') {
                    throw new NodeValidationError('Node type must be a string', nodeData);
                }

                if (nodeData.size !== undefined && (typeof nodeData.size !== 'number' || nodeData.size <= 0 || !isFinite(nodeData.size) || isNaN(nodeData.size))) {
                    throw new NodeValidationError('Node size must be a positive finite number', nodeData);
                }
            }

            // Check for existing node (always check, even when skipping validation)
            if (this.nodes.has(nodeData.id)) {
                throw new NodeExistsError(nodeData.id);
            }

            // Create node with optional positioning
            const rect = this.container.getBoundingClientRect();
            const width = rect.width || 800;
            const height = rect.height || 600;
            
            const node = new Node(nodeData, width, height);
            
            // Apply initial positioning if provided
            if (options.x !== undefined && options.y !== undefined) {
                node.position.x = options.x;
                node.position.y = options.y;
            }

            this.nodes.set(nodeData.id, node);

            // Track transaction operation if in transaction
            if (this.currentTransaction) {
                this.currentTransaction.operations.push({
                    type: 'addNode',
                    targetId: nodeData.id,
                    timestamp: Date.now(),
                    beforeState: null,
                    afterState: { ...nodeData }
                });
            }

            // Redraw if not skipped
            if (!options.skipRedraw) {
                this.renderer?.createElements(this.nodes, this.links);
                this.ui?.createLegend(Array.from(this.nodes.values()));
            }

            if (this.debug) {
                console.log(`GraphNetwork: Added node "${nodeData.name}" (${nodeData.id})`);
            }

            // Emit enhanced event
            this.emit('nodeAdded', { 
                node, 
                nodeId: nodeData.id,
                nodeData: { ...nodeData },
                type: 'nodeAdded',
                timestamp: Date.now()
            });

            return node;

        } catch (error) {
            if (this.debug) {
                console.error('GraphNetwork: Failed to add node:', GraphErrorUtils.getErrorDetails(error));
            }
            throw error;
        }
    }

    /**
     * Delete a node from the graph with enhanced orphaned edge handling
     * @param nodeId - ID of the node to delete
     * @param options - Deletion options including animation and redraw control
     */
    deleteNode(nodeId: string, options: DeletionOptions = {}): boolean {
        try {
            const node = this.nodes.get(nodeId);
            if (!node) {
                throw new NodeNotFoundError(nodeId);
            }

            const nodeData = { ...node.data };
            const connectedLinks: LinkData[] = [];

            // Collect connected links for event emission
            this.edges.forEach((edgeData, edgeId) => {
                if (edgeData.source === nodeId || edgeData.target === nodeId) {
                    connectedLinks.push({ ...edgeData });
                }
            });

            // Remove connected links (orphaned edge handling)
            this.links = this.links.filter(
                link => link.source.getId() !== nodeId && link.target.getId() !== nodeId
            );

            // Remove connected edges from edge tracking Map
            connectedLinks.forEach(connectedLink => {
                this.edges.delete(connectedLink.id);
            });

            // Remove from nodes
            this.nodes.delete(nodeId);

            // Update filter if the deleted node was being filtered
            if (this.currentFilterNodeId === nodeId) {
                this.resetFilter();
            }

            // Clear filtered nodes if they contained the deleted node
            if (this.filteredNodes?.has(nodeId)) {
                this.filteredNodes.delete(nodeId);
                if (this.filteredNodes.size === 0) {
                    this.filteredNodes = null;
                }
            }

            // Redraw if not skipped
            if (!options.skipRedraw) {
                this.renderer?.createElements(this.nodes, this.links);
                this.ui?.createLegend(Array.from(this.nodes.values()));
            }

            // Track transaction operation if in transaction
            if (this.currentTransaction) {
                this.currentTransaction.operations.push({
                    type: 'deleteNode',
                    targetId: nodeId,
                    timestamp: Date.now(),
                    beforeState: nodeData,
                    afterState: null
                });
            }

            if (this.debug) {
                console.log(`GraphNetwork: Deleted node "${nodeId}" and ${connectedLinks.length} connected edges`);
            }

            // Emit enhanced events
            this.emit('nodeRemoved', { 
                nodeId, 
                nodeData,
                connectedEdges: connectedLinks,
                type: 'nodeRemoved',
                timestamp: Date.now()
            });

            // Emit events for each removed edge
            connectedLinks.forEach(linkData => {
                this.emit('linkRemoved', {
                    linkData,
                    type: 'linkRemoved',
                    timestamp: Date.now()
                });
            });

            return true;

        } catch (error) {
            if (this.debug) {
                console.error('GraphNetwork: Failed to delete node:', GraphErrorUtils.getErrorDetails(error));
            }
            throw error;
        }
    }

    /**
     * @deprecated Use deleteNode() instead
     * Legacy method for backward compatibility
     */
    removeNode(nodeId: string, redraw: boolean = true): boolean {
        return this.deleteNode(nodeId, { skipRedraw: !redraw });
    }

    /**
     * Add an edge to the graph with enhanced validation and ID tracking
     * @param edgeData - Edge data with required ID
     * @param options - Creation options
     */
    addEdge(edgeData: EdgeData, options: EdgeCreationOptions = {}): RenderLink<T> {
        try {
            // Enhanced validation
            if (!options.skipValidation) {
                if (!edgeData.id || typeof edgeData.id !== 'string' || edgeData.id.trim() === '') {
                    throw new EdgeValidationError('Edge id must be a non-empty string', edgeData);
                }

                if (!edgeData.source || typeof edgeData.source !== 'string') {
                    throw new EdgeValidationError('Edge source must be a non-empty string', edgeData);
                }

                if (!edgeData.target || typeof edgeData.target !== 'string') {
                    throw new EdgeValidationError('Edge target must be a non-empty string', edgeData);
                }

                if (edgeData.source === edgeData.target) {
                    throw new EdgeValidationError('Edge cannot connect node to itself', edgeData);
                }
            }

            // Check for existing edge with same ID
            if (this.edges.has(edgeData.id)) {
                throw new EdgeExistsError(edgeData.id);
            }

            // Validate node references
            const sourceNode = this.nodes.get(edgeData.source);
            const targetNode = this.nodes.get(edgeData.target);
            const missingNodes: string[] = [];
            
            if (!sourceNode) missingNodes.push(edgeData.source);
            if (!targetNode) missingNodes.push(edgeData.target);
            
            if (missingNodes.length > 0) {
                throw new InvalidEdgeReferencesError(edgeData.source, edgeData.target, missingNodes);
            }

            // Validate optional fields
            if (edgeData.weight !== undefined && (typeof edgeData.weight !== 'number' || edgeData.weight < 0)) {
                throw new EdgeValidationError('Edge weight must be a non-negative number', edgeData);
            }

            if (edgeData.line_type !== undefined && !['solid', 'dashed', 'dotted'].includes(edgeData.line_type)) {
                throw new EdgeValidationError('Edge line_type must be "solid", "dashed", or "dotted"', edgeData);
            }

            // Create render link
            const renderLink: RenderLink<T> = {
                source: sourceNode!,
                target: targetNode!,
                label: edgeData.label || '',
                weight: edgeData.weight || 1,
                line_type: edgeData.line_type || 'solid'
            };

            // Store edge data and render link
            this.edges.set(edgeData.id, { ...edgeData });
            this.links.push(renderLink);

            // Track transaction operation if in transaction
            if (this.currentTransaction) {
                this.currentTransaction.operations.push({
                    type: 'addEdge',
                    targetId: edgeData.id,
                    timestamp: Date.now(),
                    beforeState: null,
                    afterState: { ...edgeData }
                });
            }

            // Redraw if not skipped
            if (!options.skipRedraw) {
                this.renderer?.createElements(this.nodes, this.links);
            }

            if (this.debug) {
                console.log(`GraphNetwork: Added edge "${edgeData.id}" (${edgeData.source} -> ${edgeData.target})`);
            }

            // Emit enhanced event
            this.emit('linkAdded', { 
                linkData: { ...edgeData },
                edgeId: edgeData.id,
                type: 'linkAdded',
                timestamp: Date.now()
            });

            return renderLink;

        } catch (error) {
            if (this.debug) {
                console.error('GraphNetwork: Failed to add edge:', GraphErrorUtils.getErrorDetails(error));
            }
            throw error;
        }
    }

    /**
     * Add a single link to the graph (backward compatibility)
     * @param linkData - Link data to add
     * @param redraw - Whether to redraw the graph (default: true)
     */
    addLink(linkData: LinkData, redraw: boolean = true): RenderLink<T> {
        // Generate ID if not provided for backward compatibility
        const edgeData: EdgeData = {
            id: linkData.id || `${linkData.source}-${linkData.target}`,
            source: linkData.source,
            target: linkData.target,
            label: linkData.label,
            weight: linkData.weight,
            line_type: linkData.line_type,
            color: linkData.color
        };

        return this.addEdge(edgeData, { skipRedraw: !redraw });
    }

    /**
     * Delete an edge from the graph by ID
     * @param edgeId - ID of the edge to delete
     * @param options - Deletion options
     */
    deleteEdge(edgeId: string, options: DeletionOptions = {}): boolean {
        try {
            // Check if edge exists
            const edgeData = this.edges.get(edgeId);
            if (!edgeData) {
                throw new EdgeNotFoundError(edgeId);
            }

            // Remove from edge tracking
            this.edges.delete(edgeId);

            // Find and remove from links array
            const initialLength = this.links.length;
            this.links = this.links.filter(link => {
                const linkId = `${link.source.getId()}-${link.target.getId()}`;
                return linkId !== edgeId && 
                       !(link.source.getId() === edgeData.source && 
                         link.target.getId() === edgeData.target);
            });

            const removed = this.links.length < initialLength;

            if (!removed) {
                // Edge was in tracking but not in links - should not happen
                if (this.debug) {
                    console.warn(`GraphNetwork: Edge "${edgeId}" was tracked but not found in render links`);
                }
                return false;
            }

            // Redraw if not skipped
            if (!options.skipRedraw) {
                this.renderer?.createElements(this.nodes, this.links);
            }

            // Track transaction operation if in transaction
            if (this.currentTransaction) {
                this.currentTransaction.operations.push({
                    type: 'deleteEdge',
                    targetId: edgeId,
                    timestamp: Date.now(),
                    beforeState: { ...edgeData },
                    afterState: null
                });
            }

            if (this.debug) {
                console.log(`GraphNetwork: Deleted edge "${edgeId}" (${edgeData.source} -> ${edgeData.target})`);
            }

            // Emit enhanced event
            this.emit('linkRemoved', { 
                linkData: { ...edgeData },
                edgeId: edgeId,
                type: 'linkRemoved',
                timestamp: Date.now()
            });

            return true;

        } catch (error) {
            if (this.debug) {
                console.error('GraphNetwork: Failed to delete edge:', GraphErrorUtils.getErrorDetails(error));
            }
            throw error;
        }
    }

    /**
     * Remove a link from the graph by source and target (backward compatibility)
     * @param sourceId - Source node ID
     * @param targetId - Target node ID
     * @param redraw - Whether to redraw the graph (default: true)
     */
    removeLink(sourceId: string, targetId: string, redraw: boolean = true): boolean {
        // Find edge ID by source and target
        let edgeIdToDelete: string | null = null;

        for (const [edgeId, edgeData] of this.edges.entries()) {
            if (edgeData.source === sourceId && edgeData.target === targetId) {
                edgeIdToDelete = edgeId;
                break;
            }
        }

        if (edgeIdToDelete) {
            return this.deleteEdge(edgeIdToDelete, { skipRedraw: !redraw });
        }

        // Fallback to old behavior for links not tracked by edge ID
        const initialLength = this.links.length;

        this.links = this.links.filter(
            link => !(link.source.getId() === sourceId && link.target.getId() === targetId)
        );

        const removed = this.links.length < initialLength;

        if (removed && redraw) {
            this.renderer?.createElements(this.nodes, this.links);
        }

        if (this.debug && removed) {
            console.log(`GraphNetwork: Removed untracked link ${sourceId} -> ${targetId}`);
        }

        if (removed) {
            this.emit('linkRemoved', { 
                linkData: { source: sourceId, target: targetId },
                type: 'linkRemoved',
                timestamp: Date.now()
            });
        }

        return removed;
    }

    /**
     * Get all nodes as plain data objects
     * @returns Array of node data
     */
    getNodes(): T[] {
        return Array.from(this.nodes.values()).map(node => ({ ...node.data }));
    }

    /**
     * Get all links as plain data objects
     * @returns Array of link data
     */
    getLinks(): LinkData[] {
        return this.links.map(link => ({
            source: link.source.getId(),
            target: link.target.getId(),
            label: link.label,
            weight: link.weight,
            line_type: link.line_type
        }));
    }

    /**
     * Get complete graph data
     * @returns Complete graph data with nodes and links
     */
    getData(): GraphData {
        return {
            nodes: this.getNodes(),
            links: this.getLinks()
        };
    }

    /**
     * Get node by ID
     * @param nodeId - Node ID
     * @returns Node data or null if not found
     */
    getNode(nodeId: string): T | null {
        const node = this.nodes.get(nodeId);
        return node ? { ...node.data } : null;
    }

    /**
     * Get edge by ID
     * @param edgeId - Edge ID
     * @returns Edge data or null if not found
     */
    getEdge(edgeId: string): LinkData | null {
        const edgeData = this.edges.get(edgeId);
        return edgeData ? { ...edgeData } : null;
    }

    /**
     * Check if node exists
     * @param nodeId - Node ID
     * @returns True if node exists
     */
    hasNode(nodeId: string): boolean {
        return this.nodes.has(nodeId);
    }

    /**
     * Check if edge exists
     * @param edgeId - Edge ID
     * @returns True if edge exists
     */
    hasEdge(edgeId: string): boolean {
        return this.edges.has(edgeId);
    }

    /**
     * Update an existing node's properties
     * @param nodeId - ID of the node to update
     * @param updates - Partial node data with updates
     * @param options - Update options
     */
    updateNode(nodeId: string, updates: Partial<Omit<T, 'id'>>, options: { skipRedraw?: boolean } = {}): boolean {
        try {
            const node = this.nodes.get(nodeId);
            if (!node) {
                throw new NodeNotFoundError(nodeId);
            }

            // Validate updates
            if (updates.name !== undefined && (typeof updates.name !== 'string' || updates.name.trim() === '')) {
                throw new NodeValidationError('Node name must be a non-empty string', updates);
            }

            if (updates.type !== undefined && typeof updates.type !== 'string') {
                throw new NodeValidationError('Node type must be a string', updates);
            }

            if (updates.size !== undefined && (typeof updates.size !== 'number' || updates.size <= 0)) {
                throw new NodeValidationError('Node size must be a positive number', updates);
            }

            // Apply updates to node data
            const oldData = { ...node.data };
            Object.assign(node.data, updates);

            // Redraw if not skipped
            if (!options.skipRedraw) {
                this.renderer?.createElements(this.nodes, this.links);
                this.ui?.createLegend(Array.from(this.nodes.values()));
            }

            // Track transaction operation if in transaction
            if (this.currentTransaction) {
                this.currentTransaction.operations.push({
                    type: 'updateNode',
                    targetId: nodeId,
                    timestamp: Date.now(),
                    beforeState: oldData,
                    afterState: { ...node.data }
                });
            }

            if (this.debug) {
                console.log(`GraphNetwork: Updated node "${nodeId}"`);
            }

            // Emit event
            this.emit('nodeUpdated', {
                nodeId,
                nodeData: { ...node.data },
                oldData,
                type: 'nodeUpdated',
                timestamp: Date.now()
            });

            return true;

        } catch (error) {
            if (this.debug) {
                console.error('GraphNetwork: Failed to update node:', GraphErrorUtils.getErrorDetails(error));
            }
            throw error;
        }
    }

    /**
     * Update an existing edge's properties
     * @param edgeId - ID of the edge to update
     * @param updates - Partial edge data with updates
     * @param options - Update options
     */
    updateEdge(edgeId: string, updates: Partial<Omit<EdgeData, 'id' | 'source' | 'target'>>, options: { skipRedraw?: boolean } = {}): boolean {
        try {
            const edgeData = this.edges.get(edgeId);
            if (!edgeData) {
                throw new EdgeNotFoundError(edgeId);
            }

            // Validate updates
            if (updates.weight !== undefined && (typeof updates.weight !== 'number' || updates.weight < 0)) {
                throw new EdgeValidationError('Edge weight must be a non-negative number', updates);
            }

            if (updates.line_type !== undefined && !['solid', 'dashed', 'dotted'].includes(updates.line_type)) {
                throw new EdgeValidationError('Edge line_type must be "solid", "dashed", or "dotted"', updates);
            }

            // Apply updates to edge data
            const oldData = { ...edgeData };
            Object.assign(edgeData, updates);
            this.edges.set(edgeId, edgeData);

            // Update corresponding render link
            const renderLink = this.links.find(link => 
                link.source.getId() === edgeData.source && 
                link.target.getId() === edgeData.target
            );

            if (renderLink) {
                if (updates.label !== undefined) renderLink.label = updates.label || '';
                if (updates.weight !== undefined) renderLink.weight = updates.weight;
                if (updates.line_type !== undefined) renderLink.line_type = updates.line_type;
            }

            // Redraw if not skipped
            if (!options.skipRedraw) {
                this.renderer?.createElements(this.nodes, this.links);
            }

            // Track transaction operation if in transaction
            if (this.currentTransaction) {
                this.currentTransaction.operations.push({
                    type: 'updateEdge',
                    targetId: edgeId,
                    timestamp: Date.now(),
                    beforeState: oldData,
                    afterState: { ...edgeData }
                });
            }

            if (this.debug) {
                console.log(`GraphNetwork: Updated edge "${edgeId}"`);
            }

            // Emit event
            this.emit('linkUpdated', {
                linkData: { ...edgeData },
                oldData,
                edgeId,
                type: 'linkUpdated',
                timestamp: Date.now()
            });

            return true;

        } catch (error) {
            if (this.debug) {
                console.error('GraphNetwork: Failed to update edge:', GraphErrorUtils.getErrorDetails(error));
            }
            throw error;
        }
    }

    // ==================== Phase 4: Bulk & Data-Driven Operations ====================

    /**
     * Update multiple nodes in bulk with intelligent batching
     * @param nodesData - Array of node updates with IDs
     * @param options - Bulk update options
     * @returns Array of successfully updated node IDs
     */
    updateNodes(nodesData: Array<{ id: string } & Partial<Omit<T, 'id'>>>, options: BulkUpdateOptions = {}): string[] {
        try {
            const updatedNodeIds: string[] = [];
            const errors: Array<{ nodeId: string; error: Error }> = [];

            // Validate all updates first if not skipped
            if (!options.skipValidation) {
                for (const nodeUpdate of nodesData) {
                    if (!nodeUpdate.id || typeof nodeUpdate.id !== 'string') {
                        throw new NodeValidationError('Node update must include a valid ID', nodeUpdate);
                    }

                    if (!this.nodes.has(nodeUpdate.id)) {
                        errors.push({
                            nodeId: nodeUpdate.id,
                            error: new NodeNotFoundError(nodeUpdate.id)
                        });
                        continue;
                    }

                    // Validate update fields
                    if (nodeUpdate.name !== undefined && (typeof nodeUpdate.name !== 'string' || nodeUpdate.name.trim() === '')) {
                        errors.push({
                            nodeId: nodeUpdate.id,
                            error: new NodeValidationError('Node name must be a non-empty string', nodeUpdate)
                        });
                    }

                    if (nodeUpdate.size !== undefined && (typeof nodeUpdate.size !== 'number' || nodeUpdate.size <= 0)) {
                        errors.push({
                            nodeId: nodeUpdate.id,
                            error: new NodeValidationError('Node size must be a positive number', nodeUpdate)
                        });
                    }
                }

                if (errors.length > 0) {
                    throw new Error(`Bulk node update validation failed for ${errors.length} nodes: ${errors.map(e => `${e.nodeId}: ${e.error.message}`).join(', ')}`);
                }
            }

            // Track transaction operation if in transaction
            if (this.currentTransaction) {
                this.currentTransaction.operations.push({
                    type: 'updateNode',
                    targetId: `bulk-${nodesData.length}-nodes`,
                    timestamp: Date.now(),
                    beforeState: nodesData.map(n => ({ ...this.nodes.get(n.id)?.data })),
                    afterState: nodesData
                });
            }

            // Apply all updates
            for (const nodeUpdate of nodesData) {
                const node = this.nodes.get(nodeUpdate.id);
                if (!node) continue;

                const oldData = { ...node.data };
                const { id, ...updates } = nodeUpdate;
                
                // Apply updates to node data
                Object.assign(node.data, updates);
                updatedNodeIds.push(nodeUpdate.id);

                if (this.debug) {
                    console.log(`GraphNetwork: Bulk updated node "${nodeUpdate.id}"`);
                }

                // Emit event for each node
                this.emit('nodeUpdated', {
                    nodeId: nodeUpdate.id,
                    nodeData: { ...node.data },
                    oldData,
                    type: 'nodeUpdated',
                    timestamp: Date.now()
                });
            }

            // Single redraw at the end for performance
            if (!options.skipRedraw && updatedNodeIds.length > 0) {
                this.renderer?.createElements(this.nodes, this.links);
                this.ui?.createLegend(Array.from(this.nodes.values()));
            }

            // Emit bulk event
            if (updatedNodeIds.length > 0) {
                this.emit('nodesBulkUpdated', {
                    nodeIds: updatedNodeIds,
                    count: updatedNodeIds.length,
                    type: 'nodesBulkUpdated',
                    timestamp: Date.now()
                });
            }

            if (this.debug) {
                console.log(`GraphNetwork: Bulk updated ${updatedNodeIds.length} nodes`);
            }

            return updatedNodeIds;

        } catch (error) {
            if (this.debug) {
                console.error('GraphNetwork: Failed to bulk update nodes:', GraphErrorUtils.getErrorDetails(error));
            }
            throw error;
        }
    }

    /**
     * Update multiple edges in bulk with intelligent batching
     * @param edgesData - Array of edge updates with IDs
     * @param options - Bulk update options
     * @returns Array of successfully updated edge IDs
     */
    updateEdges(edgesData: Array<{ id: string } & Partial<Omit<EdgeData, 'id' | 'source' | 'target'>>>, options: BulkUpdateOptions = {}): string[] {
        try {
            const updatedEdgeIds: string[] = [];
            const errors: Array<{ edgeId: string; error: Error }> = [];

            // Validate all updates first if not skipped
            if (!options.skipValidation) {
                for (const edgeUpdate of edgesData) {
                    if (!edgeUpdate.id || typeof edgeUpdate.id !== 'string') {
                        throw new EdgeValidationError('Edge update must include a valid ID', edgeUpdate);
                    }

                    if (!this.edges.has(edgeUpdate.id)) {
                        errors.push({
                            edgeId: edgeUpdate.id,
                            error: new EdgeNotFoundError(edgeUpdate.id)
                        });
                        continue;
                    }

                    // Validate update fields
                    if (edgeUpdate.weight !== undefined && (typeof edgeUpdate.weight !== 'number' || edgeUpdate.weight < 0)) {
                        errors.push({
                            edgeId: edgeUpdate.id,
                            error: new EdgeValidationError('Edge weight must be a non-negative number', edgeUpdate)
                        });
                    }

                    if (edgeUpdate.line_type !== undefined && !['solid', 'dashed', 'dotted'].includes(edgeUpdate.line_type)) {
                        errors.push({
                            edgeId: edgeUpdate.id,
                            error: new EdgeValidationError('Edge line_type must be "solid", "dashed", or "dotted"', edgeUpdate)
                        });
                    }
                }

                if (errors.length > 0) {
                    throw new Error(`Bulk edge update validation failed for ${errors.length} edges: ${errors.map(e => `${e.edgeId}: ${e.error.message}`).join(', ')}`);
                }
            }

            // Track transaction operation if in transaction
            if (this.currentTransaction) {
                this.currentTransaction.operations.push({
                    type: 'updateEdge',
                    targetId: `bulk-${edgesData.length}-edges`,
                    timestamp: Date.now(),
                    beforeState: edgesData.map(e => ({ ...this.edges.get(e.id) })),
                    afterState: edgesData
                });
            }

            // Apply all updates
            for (const edgeUpdate of edgesData) {
                const edgeData = this.edges.get(edgeUpdate.id);
                if (!edgeData) continue;

                const oldData = { ...edgeData };
                const { id, ...updates } = edgeUpdate;
                
                // Apply updates to edge data
                Object.assign(edgeData, updates);
                this.edges.set(edgeUpdate.id, edgeData);

                // Update corresponding render link
                const renderLink = this.links.find(link => 
                    link.source.getId() === edgeData.source && 
                    link.target.getId() === edgeData.target
                );

                if (renderLink) {
                    if (updates.label !== undefined) renderLink.label = updates.label || '';
                    if (updates.weight !== undefined) renderLink.weight = updates.weight;
                    if (updates.line_type !== undefined) renderLink.line_type = updates.line_type;
                }

                updatedEdgeIds.push(edgeUpdate.id);

                if (this.debug) {
                    console.log(`GraphNetwork: Bulk updated edge "${edgeUpdate.id}"`);
                }

                // Emit event for each edge
                this.emit('linkUpdated', {
                    linkData: { ...edgeData },
                    oldData,
                    edgeId: edgeUpdate.id,
                    type: 'linkUpdated',
                    timestamp: Date.now()
                });
            }

            // Single redraw at the end for performance
            if (!options.skipRedraw && updatedEdgeIds.length > 0) {
                this.renderer?.createElements(this.nodes, this.links);
            }

            // Emit bulk event
            if (updatedEdgeIds.length > 0) {
                this.emit('edgesBulkUpdated', {
                    edgeIds: updatedEdgeIds,
                    count: updatedEdgeIds.length,
                    type: 'edgesBulkUpdated',
                    timestamp: Date.now()
                });
            }

            if (this.debug) {
                console.log(`GraphNetwork: Bulk updated ${updatedEdgeIds.length} edges`);
            }

            return updatedEdgeIds;

        } catch (error) {
            if (this.debug) {
                console.error('GraphNetwork: Failed to bulk update edges:', GraphErrorUtils.getErrorDetails(error));
            }
            throw error;
        }
    }

    /**
     * Enhanced setData with smooth transitions and position preservation
     * @param data - Graph data containing nodes and edges
     * @param options - Data replacement options with animation and layout control
     */
    setData(data: GraphData, options: DataReplacementOptions = {}): void {
        try {
            if (!options.skipValidation && !isGraphData(data)) {
                throw new Error('Invalid graph data format. Must contain nodes and links arrays.');
            }

            const oldNodeCount = this.nodes.size;
            const oldLinkCount = this.links.length;

            // Store position data if preserving positions
            const positionMap = new Map<string, Position>();
            if (options.preservePositions) {
                for (const [nodeId, node] of this.nodes.entries()) {
                    positionMap.set(nodeId, { x: node.position.x, y: node.position.y });
                }
            }

            if (this.debug) {
                console.log(
                    `GraphNetwork: Setting data with ${data.nodes.length} nodes and ${data.links.length} links`,
                    options.preservePositions ? '(preserving positions)' : ''
                );
            }

            // Track transaction operation if in transaction
            if (this.currentTransaction) {
                this.currentTransaction.operations.push({
                    type: 'setData' as any,
                    targetId: 'graph',
                    timestamp: Date.now(),
                    beforeState: this.getData(),
                    afterState: data
                });
            }

            // Clear current data
            this.clearGraph();

            // Parse new data
            this.parseData(data);

            // Restore positions if requested
            if (options.preservePositions && positionMap.size > 0) {
                for (const [nodeId, node] of this.nodes.entries()) {
                    const savedPosition = positionMap.get(nodeId);
                    if (savedPosition) {
                        node.position.x = savedPosition.x;
                        node.position.y = savedPosition.y;
                    }
                }
            }

            // Create visual elements
            if (this.renderer) {
                this.renderer.createElements(this.nodes, this.links);
            }

            // Initialize event handling after elements are created
            if (this.events && this.renderer) {
                this.events.updateCallbacks(this.eventCallbacks);
                this.events.initialize(this.renderer.getSVGElement()!, this.nodes);
            }

            // Update UI with new data
            if (this.ui) {
                this.ui.createLegend(Array.from(this.nodes.values()));
            }

            // Handle layout options
            if (options.layout === 'reset' || (!options.preservePositions && options.layout !== 'preserve')) {
                this.resetAllNodePositions();
            }

            // Ensure physics engine is initialized
            if (!this.physics) {
                this.physics = new PhysicsEngine({
                    damping: this.config.damping,
                    repulsionStrength: this.config.repulsionStrength,
                    attractionStrength: this.config.attractionStrength,
                    groupingStrength: this.config.groupingStrength
                });
            }

            // Start animation if not already running
            if (!this.isAnimating) {
                this.startAnimation();
            }

            // Emit enhanced event
            this.emit('dataLoaded', {
                nodeCount: this.nodes.size,
                linkCount: this.links.length,
                oldNodeCount,
                oldLinkCount,
                preservedPositions: options.preservePositions && positionMap.size,
                type: 'dataLoaded',
                timestamp: Date.now()
            });

            if (this.debug) {
                console.log(`GraphNetwork: Data set successfully with ${this.nodes.size} nodes and ${this.links.length} links`);
            }

        } catch (error) {
            if (this.debug) {
                console.error('GraphNetwork: Failed to set data:', GraphErrorUtils.getErrorDetails(error));
            }
            throw error;
        }
    }

    /**
     * Merge new data with existing graph data intelligently
     * @param data - Graph data to merge
     * @param options - Merge options with conflict resolution
     */
    mergeData(data: GraphData, options: DataMergeOptions = {}): void {
        try {
            if (!isGraphData(data)) {
                throw new Error('Invalid graph data format. Must contain nodes and links arrays.');
            }

            const results = {
                nodesAdded: 0,
                nodesUpdated: 0,
                nodesSkipped: 0,
                edgesAdded: 0,
                edgesUpdated: 0,
                edgesSkipped: 0,
                errors: [] as string[]
            };

            if (this.debug) {
                console.log(`GraphNetwork: Merging data with ${data.nodes.length} nodes and ${data.links.length} links`);
            }

            // Track transaction operation if in transaction
            if (this.currentTransaction) {
                this.currentTransaction.operations.push({
                    type: 'mergeData' as any,
                    targetId: 'graph',
                    timestamp: Date.now(),
                    beforeState: this.getData(),
                    afterState: data
                });
            }

            // Process nodes
            for (const nodeData of data.nodes) {
                try {
                    const exists = this.nodes.has(nodeData.id);
                    
                    if (exists) {
                        // Handle node conflicts
                        if (options.nodeConflictResolution === 'error') {
                            throw new NodeExistsError(nodeData.id);
                        } else if (options.nodeConflictResolution === 'preserve') {
                            results.nodesSkipped++;
                            continue;
                        } else {
                            // Update existing node
                            const { id, ...updates } = nodeData;
                            this.updateNode(nodeData.id, updates as unknown as Partial<Omit<T, 'id'>>, { skipRedraw: true });
                            results.nodesUpdated++;
                        }
                    } else {
                        // Add new node
                        this.addNode(nodeData as T, { skipRedraw: true });
                        results.nodesAdded++;
                    }
                } catch (error) {
                    // Re-throw NodeExistsError when conflict resolution is 'error'
                    if (error instanceof NodeExistsError && options.nodeConflictResolution === 'error') {
                        throw error;
                    }
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    results.errors.push(`Node ${nodeData.id}: ${errorMessage}`);
                }
            }

            // Process edges
            for (const linkData of data.links) {
                try {
                    // Generate ID if not present
                    const edgeId = linkData.id || `${linkData.source}-${linkData.target}`;
                    const exists = this.edges.has(edgeId);
                    
                    if (exists) {
                        // Handle edge conflicts
                        if (options.edgeConflictResolution === 'error') {
                            throw new EdgeExistsError(edgeId);
                        } else if (options.edgeConflictResolution === 'preserve') {
                            results.edgesSkipped++;
                            continue;
                        } else {
                            // Update existing edge
                            const { id, source, target, ...updates } = linkData;
                            this.updateEdge(edgeId, updates, { skipRedraw: true });
                            results.edgesUpdated++;
                        }
                    } else {
                        // Add new edge
                        const edgeData: EdgeData = {
                            id: edgeId,
                            source: linkData.source,
                            target: linkData.target,
                            label: linkData.label,
                            weight: linkData.weight,
                            line_type: linkData.line_type,
                            color: linkData.color
                        };
                        this.addEdge(edgeData, { skipRedraw: true });
                        results.edgesAdded++;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    results.errors.push(`Edge ${linkData.source}-${linkData.target}: ${errorMessage}`);
                }
            }

            // Single redraw at the end
            if (!options.skipRedraw) {
                this.renderer?.createElements(this.nodes, this.links);
                this.ui?.createLegend(Array.from(this.nodes.values()));
            }

            // Emit merge event
            this.emit('dataMerged', {
                results,
                type: 'dataMerged',
                timestamp: Date.now()
            });

            if (this.debug) {
                console.log('GraphNetwork: Data merge completed:', results);
            }

            if (results.errors.length > 0 && this.debug) {
                console.warn('GraphNetwork: Merge completed with errors:', results.errors);
            }

        } catch (error) {
            if (this.debug) {
                console.error('GraphNetwork: Failed to merge data:', GraphErrorUtils.getErrorDetails(error));
            }
            throw error;
        }
    }

    /**
     * Clear all data from the graph with optional animation
     * @param options - Clear options with animation support
     */
    clearData(options: { animate?: boolean; duration?: number } = {}): void {
        try {
            const nodeCount = this.nodes.size;
            const linkCount = this.links.length;

            if (this.debug) {
                console.log(`GraphNetwork: Clearing ${nodeCount} nodes and ${linkCount} links`);
            }

            // Track transaction operation if in transaction
            if (this.currentTransaction) {
                this.currentTransaction.operations.push({
                    type: 'clearData' as any,
                    targetId: 'graph',
                    timestamp: Date.now(),
                    beforeState: this.getData(),
                    afterState: { nodes: [], links: [] }
                });
            }

            // TODO: Implement animation support in future version
            if (options.animate) {
                if (this.debug) {
                    console.log('GraphNetwork: Animation not yet implemented for clearData');
                }
            }

            // Clear the graph
            this.clearGraph();

            // Update visual elements
            this.renderer?.createElements(this.nodes, this.links);
            this.ui?.createLegend([]);

            // Stop animation if no data
            if (this.isAnimating) {
                this.stopAnimation();
            }

            // Emit clear event
            this.emit('dataCleared', {
                clearedNodeCount: nodeCount,
                clearedLinkCount: linkCount,
                type: 'dataCleared',
                timestamp: Date.now()
            });

            if (this.debug) {
                console.log('GraphNetwork: Data cleared successfully');
            }

        } catch (error) {
            if (this.debug) {
                console.error('GraphNetwork: Failed to clear data:', GraphErrorUtils.getErrorDetails(error));
            }
            throw error;
        }
    }

    /**
     * Replace all data atomically - alias for setData for clarity
     * @param data - New graph data
     * @param options - Replacement options
     */
    replaceData(data: GraphData, options: DataReplacementOptions = {}): void {
        return this.setData(data, options);
    }

    // ==================== Transaction Support ====================

    /**
     * Start a new transaction for atomic operations
     * @returns Transaction ID for tracking
     */
    startTransaction(): string {
        if (this.currentTransaction) {
            throw new Error('Transaction already in progress. Commit or rollback current transaction first.');
        }

        const transactionId = `tx-${++this.transactionIdCounter}-${Date.now()}`;
        
        this.currentTransaction = {
            id: transactionId,
            startTime: Date.now(),
            operations: [],
            beforeSnapshot: this.getData()
        };

        if (this.debug) {
            console.log(`GraphNetwork: Started transaction "${transactionId}"`);
        }

        return transactionId;
    }

    /**
     * Commit the current transaction, applying all changes
     * @returns Transaction summary
     */
    commitTransaction(): { id: string; operationCount: number; duration: number } {
        if (!this.currentTransaction) {
            throw new Error('No transaction in progress');
        }

        const transaction = this.currentTransaction;
        const duration = Date.now() - transaction.startTime;
        
        // Transaction is already applied (operations were executed during transaction)
        // Just clean up the transaction state
        this.currentTransaction = null;

        const summary = {
            id: transaction.id,
            operationCount: transaction.operations.length,
            duration
        };

        if (this.debug) {
            console.log(`GraphNetwork: Committed transaction "${transaction.id}" with ${transaction.operations.length} operations in ${duration}ms`);
        }

        // Emit transaction committed event
        this.emit('transactionCommitted', {
            transactionId: transaction.id,
            operationCount: transaction.operations.length,
            duration,
            type: 'transactionCommitted',
            timestamp: Date.now()
        });

        return summary;
    }

    /**
     * Rollback the current transaction, undoing all changes
     * @returns Transaction summary
     */
    rollbackTransaction(): { id: string; operationCount: number; duration: number } {
        if (!this.currentTransaction) {
            throw new Error('No transaction in progress');
        }

        const transaction = this.currentTransaction;
        const duration = Date.now() - transaction.startTime;

        try {
            if (this.debug) {
                console.log(`GraphNetwork: Rolling back transaction "${transaction.id}" with ${transaction.operations.length} operations`);
            }

            // Restore the snapshot from before the transaction
            this.setData(transaction.beforeSnapshot, { 
                skipValidation: true,
                preservePositions: false 
            });

            const summary = {
                id: transaction.id,
                operationCount: transaction.operations.length,
                duration
            };

            // Clear transaction state
            this.currentTransaction = null;

            if (this.debug) {
                console.log(`GraphNetwork: Rolled back transaction "${transaction.id}" in ${duration}ms`);
            }

            // Emit transaction rolled back event
            this.emit('transactionRolledBack', {
                transactionId: transaction.id,
                operationCount: transaction.operations.length,
                duration,
                type: 'transactionRolledBack',
                timestamp: Date.now()
            });

            return summary;

        } catch (error) {
            // Clear transaction state even if rollback fails
            this.currentTransaction = null;
            
            if (this.debug) {
                console.error('GraphNetwork: Failed to rollback transaction:', GraphErrorUtils.getErrorDetails(error));
            }
            throw error;
        }
    }

    /**
     * Get current transaction status
     * @returns Transaction info or null if no active transaction
     */
    getTransactionStatus(): { id: string; startTime: number; operationCount: number; duration: number } | null {
        if (!this.currentTransaction) {
            return null;
        }

        return {
            id: this.currentTransaction.id,
            startTime: this.currentTransaction.startTime,
            operationCount: this.currentTransaction.operations.length,
            duration: Date.now() - this.currentTransaction.startTime
        };
    }

    /**
     * Check if currently in a transaction
     * @returns True if transaction is active
     */
    isInTransaction(): boolean {
        return this.currentTransaction !== null;
    }

    /**
     * Get internal node instance by ID (for advanced usage)
     * @param nodeId - Node ID
     * @returns Node instance or null if not found
     */
    getNodeInstance(nodeId: string): Node<T> | null {
        return this.nodes.get(nodeId) || null;
    }

    /**
     * Get graph statistics and metrics
     * @returns Graph statistics
     */
    getStats(): GraphStats {
        return {
            nodeCount: this.nodes.size,
            linkCount: this.links.length,
            visibleNodeCount: this.filteredNodes?.size || this.nodes.size,
            filteredNodeId: this.currentFilterNodeId,
            filterDepth: this.config.filterDepth,
            isAnimating: this.isAnimating,
            fps: this.fps,
            lastUpdateTime: this.lastFrameTime
        };
    }

    /**
     * Get current configuration
     * @returns Copy of current configuration
     */
    getConfig(): GraphConfig {
        return { ...this.config };
    }

    /**
     * Update multiple configuration options
     * @param updates - Configuration updates
     */
    updateConfig(updates: Partial<GraphConfig>): void {
        Object.assign(this.config, updates);

        // Update individual modules as needed
        if (
            this.physics &&
            (updates.damping ||
                updates.repulsionStrength ||
                updates.attractionStrength ||
                updates.groupingStrength)
        ) {
            this.physics.updateConfig(updates);
        }

        if (this.ui && (updates.theme || updates.title)) {
            this.ui.updateConfig(updates);
            if (updates.theme) {
                this.setTheme(updates.theme);
            }
        }

        if (this.events && (updates.zoomSensitivity || updates.filterDepth)) {
            this.events.updateConfig(updates);
        }

        if (this.debug) {
            console.log('GraphNetwork: Configuration updated:', updates);
        }

        this.emit('configUpdated', { updates });
    }

    /**
     * Export graph data in various formats
     * @param options - Export options
     * @returns Exported data or initiates download
     */
    export(options: ExportOptions): string | void {
        const { format, includeMetadata = false, filename } = options;

        switch (format) {
            case 'json': {
                const data: GraphData & { metadata?: any } = {
                    nodes: this.getNodes(),
                    links: this.getLinks()
                };

                if (includeMetadata) {
                    data.metadata = {
                        exportTime: new Date().toISOString(),
                        stats: this.getStats(),
                        config: this.getConfig(),
                        version: '2.0.0'
                    };
                }

                const json = JSON.stringify(data, null, 2);

                if (filename) {
                    this.downloadFile(json, filename, 'application/json');
                    return;
                }

                return json;
            }

            case 'csv': {
                const nodes = this.getNodes();
                const links = this.getLinks();

                let csv = 'Type,Id,Name,Source,Target,Label,Weight\n';

                nodes.forEach(node => {
                    csv += `node,${node.id},"${node.name}",,,\n`;
                });

                links.forEach(link => {
                    csv += `link,,,"${link.source}","${link.target}","${link.label || ''}",${link.weight || 1}\n`;
                });

                if (filename) {
                    this.downloadFile(csv, filename, 'text/csv');
                    return;
                }

                return csv;
            }

            case 'svg': {
                const svg = this.renderer?.getSVGElement();
                if (!svg) throw new Error('SVG renderer not available');

                const svgData = new XMLSerializer().serializeToString(svg);

                if (filename) {
                    this.downloadFile(svgData, filename, 'image/svg+xml');
                    return;
                }

                return svgData;
            }

            case 'png': {
                // This would require additional canvas rendering logic
                throw new Error('PNG export not yet implemented');
            }

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Download data as a file
     * @private
     */
    private downloadFile(data: string, filename: string, mimeType: string): void {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    /**
     * Add event listener
     * @param event - Event name
     * @param callback - Event callback
     */
    on<K extends string>(event: K, callback: EventCallback<any>): void {
        if (!this.customEventListeners.has(event)) {
            this.customEventListeners.set(event, []);
        }
        this.customEventListeners.get(event)!.push(callback);

        // Also register with EventManager for standard events
        this.events?.on(event, callback);
    }

    /**
     * Remove event listener
     * @param event - Event name
     * @param callback - Event callback to remove
     */
    off<K extends string>(event: K, callback: EventCallback<any>): void {
        const listeners = this.customEventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }

        this.events?.off(event, callback);
    }

    /**
     * Emit event to all listeners
     * @param event - Event name
     * @param data - Event data
     */
    emit<K extends string>(event: K, data: any = {}): void {
        // Emit to custom listeners
        const listeners = this.customEventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in custom event callback for '${event}':`, error);
                }
            });
        }

        // Emit to EventManager
        this.events?.emit(event, data);
    }

    /**
     * Convert this graph to a serializable object for debugging
     * @returns Object representation of the graph state
     */
    toObject(): {
        stats: GraphStats;
        config: GraphConfig;
        data: GraphData;
        modules: {
            physics: any;
            renderer: any;
            ui: any;
            events: any;
        };
        type: string;
        version: string;
    } {
        return {
            stats: this.getStats(),
            config: this.getConfig(),
            data: {
                nodes: this.getNodes(),
                links: this.getLinks()
            },
            modules: {
                physics: this.physics?.toObject(),
                renderer: this.renderer?.toObject(),
                ui: this.ui?.toObject(),
                events: this.events?.toObject()
            },
            type: 'GraphNetwork',
            version: '2.0.0'
        };
    }

    /**
     * Clean up and destroy the graph
     */
    destroy(): void {
        if (this.debug) {
            console.log('GraphNetwork: Destroying instance');
        }

        this.stopAnimation();

        // Destroy modules
        this.physics = null;
        this.renderer?.destroy();
        this.ui?.destroy();
        this.events?.destroy();

        // Remove tooltip
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
            this.tooltip = null;
        }

        // Clear data
        this.clearGraph();

        // Clear event listeners
        this.customEventListeners.clear();

        this.emit('destroyed', {
            uptime: Date.now() - this.startTime,
            finalStats: this.getStats()
        });
    }

    /**
     * Create a string representation of the graph network
     * @returns String representation
     */
    toString(): string {
        return `GraphNetwork(${this.containerId}: ${this.nodes.size} nodes, ${this.links.length} links, ${this.config.theme} theme)`;
    }
}
