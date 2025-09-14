/**
 * GraphDataManager - Handles all node and edge CRUD operations
 *
 * Extracted from GraphNetwork to follow Single Responsibility Principle.
 * This class is responsible for:
 * - Managing node creation, updating, and deletion
 * - Managing edge creation, updating, and deletion
 * - Data validation and parsing
 * - Maintaining data consistency
 */

import { Node } from '../Node';
import { Vector } from '../Vector';
import {
    NodeData,
    EdgeData,
    LinkData,
    GraphData,
    NodeCreationOptions,
    EdgeCreationOptions,
    DeletionOptions
} from '../types/index';
import { RenderLink } from '../rendering/SVGRenderer';

export interface IGraphDataManager<T extends NodeData = NodeData> {
    // Node management
    addNode(nodeData: T, options?: NodeCreationOptions): Node<T>;
    deleteNode(nodeId: string, options?: DeletionOptions): boolean;
    removeNode(nodeId: string): boolean;
    getNode(nodeId: string): T | null;
    getNodeInstance(nodeId: string): Node<T> | null;
    hasNode(nodeId: string): boolean;
    getNodes(): T[];
    getNodeInstances(): Map<string, Node<T>>;

    // Edge management
    addEdge(edgeData: EdgeData, options?: EdgeCreationOptions): RenderLink<T>;
    addLink(linkData: LinkData): RenderLink<T>;
    deleteEdge(edgeId: string, options?: DeletionOptions): boolean;
    removeLink(sourceId: string, targetId: string): boolean;
    getEdge(edgeId: string): LinkData | null;
    hasEdge(edgeId: string): boolean;
    getLinks(): LinkData[];
    getRenderLinks(): RenderLink<T>[];

    // Data operations
    setData(data: GraphData): void;
    mergeData(data: GraphData): void;
    clearData(): void;
    getData(): GraphData;

    // Validation
    validateNodeData(nodeData: T): boolean;
    validateEdgeData(edgeData: EdgeData): boolean;
    validateGraphData(data: GraphData): boolean;
}

export class GraphDataManager<T extends NodeData = NodeData> implements IGraphDataManager<T> {
    private nodes = new Map<string, Node<T>>();
    private edges = new Map<string, LinkData>();
    private renderLinks: RenderLink<T>[] = [];
    private nodeDataMap = new Map<string, T>();

    constructor(
        private containerWidth: number = 800,
        private containerHeight: number = 600
    ) {}

    // ==================== NODE MANAGEMENT ====================

    addNode(nodeData: T, options: NodeCreationOptions = {}): Node<T> {
        if (!this.validateNodeData(nodeData)) {
            throw new Error(`Invalid node data for ID: ${nodeData.id}`);
        }

        if (this.hasNode(nodeData.id)) {
            throw new Error(`Node with ID '${nodeData.id}' already exists`);
        }

        const node = new Node<T>(nodeData, this.containerWidth, this.containerHeight);

        // Apply position override if provided
        if (options.position) {
            node.position = new Vector(options.position.x, options.position.y);
        }

        // Apply fixed state if provided
        if (options.fixed) {
            node.fix();
        }

        this.nodes.set(nodeData.id, node);
        this.nodeDataMap.set(nodeData.id, nodeData);

        return node;
    }

    deleteNode(nodeId: string, _options: DeletionOptions = {}): boolean {
        if (!this.hasNode(nodeId)) {
            return false;
        }

        // Remove all links connected to this node
        const linksToRemove: RenderLink<T>[] = [];

        for (const link of this.renderLinks) {
            if (link.source.getId() === nodeId || link.target.getId() === nodeId) {
                linksToRemove.push(link);
            }
        }

        // Remove the links
        for (const link of linksToRemove) {
            this.removeLink(link.source.getId(), link.target.getId());
        }

        // Remove the node
        this.nodes.delete(nodeId);
        this.nodeDataMap.delete(nodeId);

        return true;
    }

    removeNode(nodeId: string): boolean {
        return this.deleteNode(nodeId);
    }

    getNode(nodeId: string): T | null {
        return this.nodeDataMap.get(nodeId) || null;
    }

    getNodeInstance(nodeId: string): Node<T> | null {
        return this.nodes.get(nodeId) || null;
    }

    hasNode(nodeId: string): boolean {
        return this.nodes.has(nodeId);
    }

    getNodes(): T[] {
        return Array.from(this.nodeDataMap.values());
    }

    getNodeInstances(): Map<string, Node<T>> {
        return new Map(this.nodes);
    }

    // ==================== EDGE MANAGEMENT ====================

    addEdge(edgeData: EdgeData, _options: EdgeCreationOptions = {}): RenderLink<T> {
        if (!this.validateEdgeData(edgeData)) {
            throw new Error(`Invalid edge data for ID: ${edgeData.id}`);
        }

        const sourceNode = this.nodes.get(edgeData.source);
        const targetNode = this.nodes.get(edgeData.target);

        if (!sourceNode) {
            throw new Error(`Source node '${edgeData.source}' not found`);
        }

        if (!targetNode) {
            throw new Error(`Target node '${edgeData.target}' not found`);
        }

        // Convert EdgeData to LinkData
        const linkData: LinkData = {
            source: edgeData.source,
            target: edgeData.target,
            id: edgeData.id,
            name: edgeData.name || '',
            type: edgeData.type,
            weight: edgeData.weight || 1
        };

        return this.addLink(linkData);
    }

    addLink(linkData: LinkData): RenderLink<T> {
        const sourceNode = this.nodes.get(linkData.source);
        const targetNode = this.nodes.get(linkData.target);

        if (!sourceNode || !targetNode) {
            throw new Error(`Cannot create link: source or target node not found`);
        }

        // Check if link already exists
        const existingLink = this.renderLinks.find(
            link =>
                link.source.getId() === linkData.source && link.target.getId() === linkData.target
        );

        if (existingLink) {
            return existingLink;
        }

        const renderLink: RenderLink<T> = {
            source: sourceNode,
            target: targetNode,
            data: linkData
        };

        this.renderLinks.push(renderLink);

        if (linkData.id) {
            this.edges.set(linkData.id, linkData);
        }

        return renderLink;
    }

    deleteEdge(edgeId: string, _options: DeletionOptions = {}): boolean {
        if (!this.hasEdge(edgeId)) {
            return false;
        }

        const edgeData = this.edges.get(edgeId);
        if (!edgeData) {
            return false;
        }

        return this.removeLink(edgeData.source, edgeData.target);
    }

    removeLink(sourceId: string, targetId: string): boolean {
        const linkIndex = this.renderLinks.findIndex(
            link => link.source.getId() === sourceId && link.target.getId() === targetId
        );

        if (linkIndex === -1) {
            return false;
        }

        const removedLink = this.renderLinks.splice(linkIndex, 1)[0];

        // Remove from edges map if it has an ID
        if (removedLink.data.id) {
            this.edges.delete(removedLink.data.id);
        }

        return true;
    }

    getEdge(edgeId: string): LinkData | null {
        return this.edges.get(edgeId) || null;
    }

    hasEdge(edgeId: string): boolean {
        return this.edges.has(edgeId);
    }

    getLinks(): LinkData[] {
        return this.renderLinks.map(link => link.data);
    }

    getRenderLinks(): RenderLink<T>[] {
        return [...this.renderLinks];
    }

    // ==================== DATA OPERATIONS ====================

    setData(data: GraphData): void {
        if (!this.validateGraphData(data)) {
            throw new Error('Invalid graph data provided');
        }

        this.clearData();
        this.mergeData(data);
    }

    mergeData(data: GraphData): void {
        if (!this.validateGraphData(data)) {
            throw new Error('Invalid graph data provided');
        }

        // Add nodes first
        if (data.nodes) {
            for (const nodeData of data.nodes) {
                if (!this.hasNode(nodeData.id)) {
                    this.addNode(nodeData as T);
                }
            }
        }

        // Then add links/edges
        if (data.links) {
            for (const linkData of data.links) {
                this.addLink(linkData);
            }
        }

        if (data.edges) {
            for (const edgeData of data.edges) {
                this.addEdge(edgeData);
            }
        }
    }

    clearData(): void {
        this.nodes.clear();
        this.edges.clear();
        this.renderLinks.length = 0;
        this.nodeDataMap.clear();
    }

    getData(): GraphData {
        return {
            nodes: this.getNodes(),
            links: this.getLinks(),
            edges: Array.from(this.edges.values()).filter(edge => edge.id) as EdgeData[]
        };
    }

    // ==================== VALIDATION ====================

    validateNodeData(nodeData: T): boolean {
        if (!nodeData || typeof nodeData !== 'object') {
            return false;
        }

        if (!nodeData.id || typeof nodeData.id !== 'string') {
            return false;
        }

        if (!nodeData.name || typeof nodeData.name !== 'string') {
            return false;
        }

        return true;
    }

    validateEdgeData(edgeData: EdgeData): boolean {
        if (!edgeData || typeof edgeData !== 'object') {
            return false;
        }

        if (!edgeData.source || typeof edgeData.source !== 'string') {
            return false;
        }

        if (!edgeData.target || typeof edgeData.target !== 'string') {
            return false;
        }

        if (!edgeData.id || typeof edgeData.id !== 'string') {
            return false;
        }

        return true;
    }

    validateGraphData(data: GraphData): boolean {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // Validate nodes
        if (data.nodes) {
            if (!Array.isArray(data.nodes)) {
                return false;
            }

            for (const node of data.nodes) {
                if (!this.validateNodeData(node as T)) {
                    return false;
                }
            }
        }

        // Validate links
        if (data.links) {
            if (!Array.isArray(data.links)) {
                return false;
            }

            for (const link of data.links) {
                if (!link.source || !link.target) {
                    return false;
                }
            }
        }

        // Validate edges
        if (data.edges) {
            if (!Array.isArray(data.edges)) {
                return false;
            }

            for (const edge of data.edges) {
                if (!this.validateEdgeData(edge)) {
                    return false;
                }
            }
        }

        return true;
    }

    // ==================== UTILITY METHODS ====================

    updateContainerSize(width: number, height: number): void {
        this.containerWidth = width;
        this.containerHeight = height;
    }

    getNodeCount(): number {
        return this.nodes.size;
    }

    getEdgeCount(): number {
        return this.renderLinks.length;
    }

    getStats(): {
        nodeCount: number;
        edgeCount: number;
        isolatedNodes: number;
    } {
        const nodeCount = this.getNodeCount();
        const edgeCount = this.getEdgeCount();

        // Count isolated nodes (nodes with no connections)
        const connectedNodes = new Set<string>();
        for (const link of this.renderLinks) {
            connectedNodes.add(link.source.getId());
            connectedNodes.add(link.target.getId());
        }

        const isolatedNodes = nodeCount - connectedNodes.size;

        return {
            nodeCount,
            edgeCount,
            isolatedNodes
        };
    }
}
