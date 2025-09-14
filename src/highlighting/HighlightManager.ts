/**
 * HighlightManager - Handles element highlighting with path finding
 *
 * Provides advanced highlighting capabilities with support for:
 * - Individual element highlighting with custom styles
 * - Path highlighting between nodes with pathfinding
 * - Neighbor highlighting with configurable depth
 * - Connection highlighting for node relationships
 * - Animated highlight effects and transitions
 */

import {
    IHighlightManager,
    HighlightStyle,
    PathHighlightOptions,
    NeighborHighlightOptions,
    HighlightEvent
} from '../types/styling';

/**
 * Highlight change callback type
 */
export type HighlightChangeCallback = (event: HighlightEvent) => void;

/**
 * Internal highlight state
 */
interface HighlightState {
    nodes: Map<string, HighlightStyle>;
    edges: Map<string, HighlightStyle>;
    paths: Map<string, string[]>; // path ID -> node/edge IDs
    animations: Map<string, number>; // element ID -> animation ID
}

/**
 * Graph adjacency for pathfinding
 */
interface GraphAdjacency {
    nodeToEdges: Map<string, string[]>;
    edgeToNodes: Map<string, [string, string]>;
    adjacency: Map<string, Set<string>>;
}

/**
 * HighlightManager handles all highlighting operations
 */
export class HighlightManager implements IHighlightManager {
    private state: HighlightState;
    private readonly onHighlightChange?: HighlightChangeCallback;
    private graphAdjacency?: GraphAdjacency;
    private animationCounter = 0;

    /**
     * Create a new HighlightManager
     * @param onHighlightChange - Callback for highlight changes
     */
    constructor(onHighlightChange?: HighlightChangeCallback) {
        this.state = {
            nodes: new Map(),
            edges: new Map(),
            paths: new Map(),
            animations: new Map()
        };
        this.onHighlightChange = onHighlightChange;
    }

    /**
     * Highlight a single node
     */
    highlightNode(nodeId: string, style: HighlightStyle = {}): void {
        const highlightStyle = this.mergeWithDefaults(style);
        this.state.nodes.set(nodeId, highlightStyle);
        this.applyHighlightToElement(nodeId, 'node', highlightStyle);
        this.emitHighlightChange();
    }

    /**
     * Highlight multiple nodes
     */
    highlightNodes(nodeIds: string[], style: HighlightStyle = {}): void {
        const highlightStyle = this.mergeWithDefaults(style);

        for (const nodeId of nodeIds) {
            this.state.nodes.set(nodeId, highlightStyle);
            this.applyHighlightToElement(nodeId, 'node', highlightStyle);
        }

        this.emitHighlightChange();
    }

    /**
     * Highlight a single edge
     */
    highlightEdge(edgeId: string, style: HighlightStyle = {}): void {
        const highlightStyle = this.mergeWithDefaults(style);
        this.state.edges.set(edgeId, highlightStyle);
        this.applyHighlightToElement(edgeId, 'edge', highlightStyle);
        this.emitHighlightChange();
    }

    /**
     * Highlight multiple edges
     */
    highlightEdges(edgeIds: string[], style: HighlightStyle = {}): void {
        const highlightStyle = this.mergeWithDefaults(style);

        for (const edgeId of edgeIds) {
            this.state.edges.set(edgeId, highlightStyle);
            this.applyHighlightToElement(edgeId, 'edge', highlightStyle);
        }

        this.emitHighlightChange();
    }

    /**
     * Highlight shortest path between two nodes
     */
    highlightPath(
        sourceId: string,
        targetId: string,
        options: PathHighlightOptions = {}
    ): string[] | null {
        if (!this.graphAdjacency) {
            console.warn(
                'HighlightManager: Graph adjacency not initialized. Call updateGraphStructure() first.'
            );
            return null;
        }

        const path = this.findShortestPath(sourceId, targetId);
        if (!path || path.length === 0) {
            return null;
        }

        const pathId = `path_${sourceId}_${targetId}`;
        const highlightedElements: string[] = [];

        // Highlight nodes in path
        const nodeStyle = this.mergeWithDefaults({
            color: options.pathColor || options.color || '#ff6b35',
            strokeWidth: options.strokeWidth || 3,
            animated: options.showFlow || false,
            duration: options.duration || 1000,
            zIndex: options.zIndex || 100
        });

        for (let i = 0; i < path.length; i++) {
            const nodeId = path[i];
            this.state.nodes.set(nodeId, nodeStyle);
            this.applyHighlightToElement(nodeId, 'node', nodeStyle);
            highlightedElements.push(nodeId);

            // Highlight edges between consecutive nodes
            if (i < path.length - 1) {
                const edgeId = this.findEdgeBetweenNodes(path[i], path[i + 1]);
                if (edgeId) {
                    const edgeStyle = this.mergeWithDefaults({
                        color: options.pathColor || options.color || '#ff6b35',
                        strokeWidth: (options.pathWidth || options.strokeWidth || 3) + 1,
                        animated: options.showFlow || false,
                        duration: options.duration || 1000,
                        zIndex: options.zIndex || 100
                    });

                    this.state.edges.set(edgeId, edgeStyle);
                    this.applyHighlightToElement(edgeId, 'edge', edgeStyle);
                    highlightedElements.push(edgeId);
                }
            }
        }

        // Store path for later cleanup
        this.state.paths.set(pathId, highlightedElements);

        // Add flow animation if requested
        if (options.showFlow) {
            this.animatePathFlow(highlightedElements, options);
        }

        this.emitHighlightChange();
        return highlightedElements;
    }

    /**
     * Highlight neighbors of a node with configurable depth
     */
    highlightNeighbors(nodeId: string, options: NeighborHighlightOptions = {}): string[] {
        if (!this.graphAdjacency) {
            console.warn(
                'HighlightManager: Graph adjacency not initialized. Call updateGraphStructure() first.'
            );
            return [];
        }

        const depth = options.depth || 1;
        const highlightedElements: string[] = [];
        const visited = new Set<string>();
        const queue: Array<{ nodeId: string; currentDepth: number }> = [
            { nodeId, currentDepth: 0 }
        ];

        // Highlight the source node
        const sourceStyle = this.mergeWithDefaults({
            color: options.color || '#3b82f6',
            strokeWidth: options.strokeWidth || 3,
            opacity: options.opacity || 0.8,
            zIndex: options.zIndex || 50
        });

        this.state.nodes.set(nodeId, sourceStyle);
        this.applyHighlightToElement(nodeId, 'node', sourceStyle);
        highlightedElements.push(nodeId);
        visited.add(nodeId);

        // BFS to find neighbors at different depths
        while (queue.length > 0) {
            const { nodeId: currentNode, currentDepth } = queue.shift()!;

            if (currentDepth >= depth) continue;

            const neighbors = this.graphAdjacency.adjacency.get(currentNode) || new Set();

            for (const neighborId of neighbors) {
                if (visited.has(neighborId)) continue;

                visited.add(neighborId);

                // Calculate style based on depth
                const depthRatio = (currentDepth + 1) / depth;
                const neighborStyle = this.getDepthBasedStyle(
                    options,
                    currentDepth + 1,
                    depthRatio
                );

                this.state.nodes.set(neighborId, neighborStyle);
                this.applyHighlightToElement(neighborId, 'node', neighborStyle);
                highlightedElements.push(neighborId);

                // Highlight connecting edge if requested
                if (options.highlightEdges) {
                    const edgeId = this.findEdgeBetweenNodes(currentNode, neighborId);
                    if (edgeId) {
                        const edgeStyle = this.mergeWithDefaults({
                            color: neighborStyle.color,
                            strokeWidth: (neighborStyle.strokeWidth || 2) - 1,
                            opacity: (neighborStyle.opacity || 0.8) * 0.7,
                            zIndex: (neighborStyle.zIndex || 50) - 10
                        });

                        this.state.edges.set(edgeId, edgeStyle);
                        this.applyHighlightToElement(edgeId, 'edge', edgeStyle);
                        highlightedElements.push(edgeId);
                    }
                }

                queue.push({ nodeId: neighborId, currentDepth: currentDepth + 1 });
            }
        }

        this.emitHighlightChange();
        return highlightedElements;
    }

    /**
     * Highlight all connections (edges) for a node
     */
    highlightConnections(nodeId: string, style: HighlightStyle = {}): string[] {
        if (!this.graphAdjacency) {
            console.warn(
                'HighlightManager: Graph adjacency not initialized. Call updateGraphStructure() first.'
            );
            return [];
        }

        const connectedEdges = this.graphAdjacency.nodeToEdges.get(nodeId) || [];
        const highlightStyle = this.mergeWithDefaults(style);

        // Highlight the node itself
        this.state.nodes.set(nodeId, highlightStyle);
        this.applyHighlightToElement(nodeId, 'node', highlightStyle);

        // Highlight all connected edges
        for (const edgeId of connectedEdges) {
            this.state.edges.set(edgeId, highlightStyle);
            this.applyHighlightToElement(edgeId, 'edge', highlightStyle);
        }

        this.emitHighlightChange();
        return [nodeId, ...connectedEdges];
    }

    /**
     * Clear all highlights
     */
    clearHighlights(): void {
        // Clear node highlights
        for (const nodeId of this.state.nodes.keys()) {
            this.clearElementHighlight(nodeId, 'node');
        }

        // Clear edge highlights
        for (const edgeId of this.state.edges.keys()) {
            this.clearElementHighlight(edgeId, 'edge');
        }

        // Clear animations
        for (const animationId of this.state.animations.values()) {
            cancelAnimationFrame(animationId);
        }

        // Reset state
        this.state.nodes.clear();
        this.state.edges.clear();
        this.state.paths.clear();
        this.state.animations.clear();

        this.emitHighlightChange();
    }

    /**
     * Clear highlight for a specific node
     */
    clearNodeHighlight(nodeId: string): void {
        if (this.state.nodes.has(nodeId)) {
            this.state.nodes.delete(nodeId);
            this.clearElementHighlight(nodeId, 'node');
            this.emitHighlightChange();
        }
    }

    /**
     * Clear highlight for a specific edge
     */
    clearEdgeHighlight(edgeId: string): void {
        if (this.state.edges.has(edgeId)) {
            this.state.edges.delete(edgeId);
            this.clearElementHighlight(edgeId, 'edge');
            this.emitHighlightChange();
        }
    }

    /**
     * Check if node is currently highlighted
     */
    isNodeHighlighted(nodeId: string): boolean {
        return this.state.nodes.has(nodeId);
    }

    /**
     * Check if edge is currently highlighted
     */
    isEdgeHighlighted(edgeId: string): boolean {
        return this.state.edges.has(edgeId);
    }

    /**
     * Get all highlighted node IDs
     */
    getHighlightedNodes(): string[] {
        return Array.from(this.state.nodes.keys());
    }

    /**
     * Get all highlighted edge IDs
     */
    getHighlightedEdges(): string[] {
        return Array.from(this.state.edges.keys());
    }

    /**
     * Update graph structure for pathfinding
     */
    updateGraphStructure(
        nodes: string[],
        edges: Array<{ id: string; source: string; target: string }>
    ): void {
        this.graphAdjacency = {
            nodeToEdges: new Map(),
            edgeToNodes: new Map(),
            adjacency: new Map()
        };

        // Initialize adjacency for all nodes
        for (const nodeId of nodes) {
            this.graphAdjacency.nodeToEdges.set(nodeId, []);
            this.graphAdjacency.adjacency.set(nodeId, new Set());
        }

        // Build adjacency structure
        for (const edge of edges) {
            const { id: edgeId, source, target } = edge;

            // Map edge to nodes
            this.graphAdjacency.edgeToNodes.set(edgeId, [source, target]);

            // Add edge to node mappings
            this.graphAdjacency.nodeToEdges.get(source)?.push(edgeId);
            this.graphAdjacency.nodeToEdges.get(target)?.push(edgeId);

            // Add to adjacency list (undirected graph)
            this.graphAdjacency.adjacency.get(source)?.add(target);
            this.graphAdjacency.adjacency.get(target)?.add(source);
        }
    }

    /**
     * Find shortest path between two nodes using BFS
     */
    private findShortestPath(sourceId: string, targetId: string): string[] | null {
        if (!this.graphAdjacency || sourceId === targetId) {
            return null;
        }

        const visited = new Set<string>();
        const queue: string[] = [sourceId];
        const parent = new Map<string, string>();

        visited.add(sourceId);

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current === targetId) {
                // Reconstruct path
                const path: string[] = [];
                let node = targetId;

                while (node !== undefined) {
                    path.unshift(node);
                    node = parent.get(node)!;
                }

                return path;
            }

            const neighbors = this.graphAdjacency.adjacency.get(current) || new Set();

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    parent.set(neighbor, current);
                    queue.push(neighbor);
                }
            }
        }

        return null; // No path found
    }

    /**
     * Find edge ID between two nodes
     */
    private findEdgeBetweenNodes(nodeA: string, nodeB: string): string | null {
        if (!this.graphAdjacency) return null;

        const edgesA = this.graphAdjacency.nodeToEdges.get(nodeA) || [];

        for (const edgeId of edgesA) {
            const nodes = this.graphAdjacency.edgeToNodes.get(edgeId);
            if (
                nodes &&
                ((nodes[0] === nodeA && nodes[1] === nodeB) ||
                    (nodes[0] === nodeB && nodes[1] === nodeA))
            ) {
                return edgeId;
            }
        }

        return null;
    }

    /**
     * Get depth-based style for neighbor highlighting
     */
    private getDepthBasedStyle(
        options: NeighborHighlightOptions,
        depth: number,
        ratio: number
    ): HighlightStyle {
        const baseColor = options.color || '#3b82f6';
        const depthColors = options.depthColors || [];

        let color = baseColor;
        if (depthColors.length > 0 && depth - 1 < depthColors.length) {
            color = depthColors[depth - 1];
        }

        let opacity = options.opacity || 0.8;
        if (options.fadeByDistance) {
            opacity *= 1 - ratio * 0.5; // Fade to 50% at max depth
        }

        return this.mergeWithDefaults({
            color,
            opacity,
            strokeWidth: Math.max(1, (options.strokeWidth || 3) - depth),
            zIndex: Math.max(1, (options.zIndex || 50) - depth * 10)
        });
    }

    /**
     * Animate flow along path
     */
    private animatePathFlow(elements: string[], options: PathHighlightOptions): void {
        const duration = options.duration || 1000;
        const speed = options.flowSpeed || 1;

        // Create flowing animation along the path
        const animate = () => {
            const animationId = this.animationCounter++;

            const startTime = Date.now();
            const animateFrame = () => {
                const elapsed = Date.now() - startTime;
                const progress = (elapsed / duration) % 1;

                // Apply animated dash offset to edges in path
                elements.forEach((elementId, index) => {
                    if (this.state.edges.has(elementId)) {
                        const element = document.getElementById(`edge-${elementId}`);
                        if (element) {
                            const offset = progress * 20 * speed;
                            element.style.strokeDashoffset = `${offset}px`;
                        }
                    }
                });

                if (elapsed < duration) {
                    this.state.animations.set(
                        `flow_${animationId}`,
                        requestAnimationFrame(animateFrame)
                    );
                }
            };

            requestAnimationFrame(animateFrame);
        };

        animate();
    }

    /**
     * Apply highlight style to DOM element
     */
    private applyHighlightToElement(
        elementId: string,
        type: 'node' | 'edge',
        style: HighlightStyle
    ): void {
        const element = document.getElementById(`${type}-${elementId}`);
        if (!element) return;

        // Apply highlight styles
        if (style.color) {
            if (type === 'node') {
                element.setAttribute('fill', style.color);
            }
            element.setAttribute('stroke', style.color);
        }

        if (style.strokeWidth) {
            element.setAttribute('stroke-width', String(style.strokeWidth));
        }

        if (style.opacity !== undefined) {
            element.setAttribute('opacity', String(style.opacity));
        }

        // Apply CSS classes for animations
        if (style.animated) {
            element.classList.add('graph-highlight-animated');
        }

        if (style.glow) {
            element.classList.add('graph-highlight-glow');
        }

        if (style.pulse) {
            element.classList.add('graph-highlight-pulse');
        }

        // Set z-index via CSS custom property
        if (style.zIndex !== undefined) {
            element.style.setProperty('--highlight-z-index', String(style.zIndex));
        }
    }

    /**
     * Clear highlight from DOM element
     */
    private clearElementHighlight(elementId: string, type: 'node' | 'edge'): void {
        const element = document.getElementById(`${type}-${elementId}`);
        if (!element) return;

        // Remove highlight classes
        element.classList.remove(
            'graph-highlight-animated',
            'graph-highlight-glow',
            'graph-highlight-pulse'
        );

        // Remove custom styles
        element.style.removeProperty('--highlight-z-index');
        element.style.strokeDashoffset = '';

        // Reset to default appearance would need integration with StyleManager
    }

    /**
     * Merge style with defaults
     */
    private mergeWithDefaults(style: HighlightStyle): HighlightStyle {
        return {
            color: '#3b82f6',
            strokeWidth: 2,
            opacity: 1,
            animated: false,
            glow: false,
            pulse: false,
            duration: 300,
            zIndex: 10,
            ...style
        };
    }

    /**
     * Emit highlight change event
     */
    private emitHighlightChange(): void {
        if (!this.onHighlightChange) return;

        const event: HighlightEvent = {
            type: 'highlightChanged',
            highlightedNodes: this.getHighlightedNodes(),
            highlightedEdges: this.getHighlightedEdges(),
            style: {}, // Could aggregate common styles
            timestamp: Date.now()
        };

        // Use a small delay to allow for batching
        if (typeof setTimeout !== 'undefined') {
            setTimeout(() => this.onHighlightChange!(event), 0);
        } else {
            // For testing environment without setTimeout
            this.onHighlightChange!(event);
        }
    }
}
