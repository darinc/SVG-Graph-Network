import { Vector } from '../Vector';
import { Node } from '../Node';
import { PhysicsConfig, NodeData } from '../types/index';

/**
 * Physics simulation result containing force and energy metrics
 */
export interface SimulationMetrics {
    totalEnergy: number;
    maxForce: number;
    averageForce: number;
    nodeCount: number;
    activeNodeCount: number;
}

/**
 * Link representation for physics calculations
 */
export interface PhysicsLink<T extends NodeData = NodeData> {
    source: Node<T>;
    target: Node<T>;
    weight?: number;
}

/**
 * PhysicsEngine - Handles force calculations and position updates for graph nodes
 * Enhanced with full TypeScript support and comprehensive physics simulation
 */
export class PhysicsEngine {
    private readonly config: PhysicsConfig;

    /**
     * Create a new PhysicsEngine instance
     * @param config - Physics configuration parameters
     */
    constructor(config: Partial<PhysicsConfig> = {}) {
        this.config = {
            damping: 0.95,
            repulsionStrength: 6500,
            attractionStrength: 0.001,
            groupingStrength: 0.001,
            ...config
        };
    }

    /**
     * Update configuration parameters
     * @param newConfig - Partial configuration to merge with existing config
     */
    updateConfig(newConfig: Partial<PhysicsConfig>): void {
        Object.assign(this.config, newConfig);
    }

    /**
     * Calculate repulsion and attraction forces for all nodes
     * @param nodes - Map of nodes by ID
     * @param links - Array of physics link objects
     * @param filteredNodes - Set of visible node IDs (null = all visible)
     * @returns Simulation metrics for analysis
     */
    updateForces<T extends NodeData>(
        nodes: Map<string, Node<T>>,
        links: PhysicsLink<T>[],
        filteredNodes: Set<string> | null = null
    ): SimulationMetrics {
        const nodesArray = Array.from(nodes.values());

        // Reset forces
        nodesArray.forEach(node => node.resetForce());

        // Calculate repulsion forces between all node pairs
        for (let i = 0; i < nodesArray.length; i++) {
            for (let j = i + 1; j < nodesArray.length; j++) {
                const nodeA = nodesArray[i];
                const nodeB = nodesArray[j];

                // Skip filtered out nodes
                if (
                    filteredNodes &&
                    (!filteredNodes.has(nodeA.getId()) || !filteredNodes.has(nodeB.getId()))
                ) {
                    continue;
                }

                this._calculateRepulsionForce(nodeA, nodeB);
                this._calculateGroupingForce(nodeA, nodeB);
            }
        }

        // Calculate attraction forces for connected nodes
        links.forEach(link => {
            if (
                filteredNodes &&
                (!filteredNodes.has(link.source.getId()) || !filteredNodes.has(link.target.getId()))
            ) {
                return;
            }

            this._calculateAttractionForce(link.source, link.target, link.weight);
        });

        return this._calculateMetrics(nodes, filteredNodes);
    }

    /**
     * Update node positions based on calculated forces
     * @param nodes - Map of nodes by ID
     * @param filteredNodes - Set of visible node IDs (null = all visible)
     * @param deltaTime - Time step for integration (default: 1)
     */
    updatePositions<T extends NodeData>(
        nodes: Map<string, Node<T>>,
        filteredNodes: Set<string> | null = null,
        deltaTime: number = 1
    ): void {
        const nodesArray = Array.from(nodes.values());

        nodesArray.forEach(node => {
            // Skip fixed nodes or filtered out nodes
            if (node.isFixed) return;
            if (filteredNodes && !filteredNodes.has(node.getId())) return;

            // Use the Node's built-in physics integration
            node.updatePosition(deltaTime, this.config.damping);
        });
    }

    /**
     * Calculate repulsion force between two nodes
     * @private
     */
    private _calculateRepulsionForce<T extends NodeData>(nodeA: Node<T>, nodeB: Node<T>): void {
        const diff = nodeA.position.subtract(nodeB.position);
        const distance = diff.magnitude();

        if (distance === 0) {
            // Handle overlapping nodes by applying random small force
            const randomAngle = Math.random() * 2 * Math.PI;
            const separationForce = Vector.fromPolar(
                this.config.repulsionStrength * 0.01,
                randomAngle
            );
            nodeA.applyForce(separationForce);
            nodeB.applyForce(separationForce.multiply(-1));
            return;
        }

        // Get effective radii for collision detection
        const combinedRadius = (nodeA.getEffectiveRadius() + nodeB.getEffectiveRadius()) * 0.5;
        const effectiveDistance = Math.max(distance, combinedRadius);

        const repulsionForce = diff
            .normalize()
            .multiply(this.config.repulsionStrength / (effectiveDistance * effectiveDistance));

        nodeA.applyForce(repulsionForce);
        nodeB.applyForce(repulsionForce.multiply(-1));
    }

    /**
     * Calculate grouping force for nodes of the same type
     * @private
     */
    private _calculateGroupingForce<T extends NodeData>(nodeA: Node<T>, nodeB: Node<T>): void {
        if (!nodeA.hasSameType(nodeB) || this.config.groupingStrength <= 0) {
            return;
        }

        const diff = nodeA.position.subtract(nodeB.position);
        const distance = diff.magnitude();

        if (distance === 0) return;

        const attractionForce = diff.normalize().multiply(-this.config.groupingStrength * distance);

        nodeA.applyForce(attractionForce);
        nodeB.applyForce(attractionForce.multiply(-1));
    }

    /**
     * Calculate attraction force between connected nodes
     * @private
     */
    private _calculateAttractionForce<T extends NodeData>(
        sourceNode: Node<T>,
        targetNode: Node<T>,
        weight: number = 1.0
    ): void {
        const diff = sourceNode.position.subtract(targetNode.position);
        const distance = diff.magnitude();

        if (distance === 0) return;

        const attractionForce = diff
            .normalize()
            .multiply(this.config.attractionStrength * distance * weight);

        sourceNode.applyForce(attractionForce.multiply(-1));
        targetNode.applyForce(attractionForce);
    }

    /**
     * Calculate simulation metrics for analysis and debugging
     * @private
     */
    private _calculateMetrics<T extends NodeData>(
        nodes: Map<string, Node<T>>,
        filteredNodes: Set<string> | null
    ): SimulationMetrics {
        const nodesArray = Array.from(nodes.values());
        const activeNodes = filteredNodes
            ? nodesArray.filter(node => filteredNodes.has(node.getId()))
            : nodesArray;

        let totalEnergy = 0;
        let maxForce = 0;
        let totalForce = 0;

        activeNodes.forEach(node => {
            const force = node.force.magnitude();
            const kinetic = node.velocity.magnitude() * node.velocity.magnitude() * 0.5;

            totalEnergy += kinetic;
            totalForce += force;
            maxForce = Math.max(maxForce, force);
        });

        return {
            totalEnergy,
            maxForce,
            averageForce: activeNodes.length > 0 ? totalForce / activeNodes.length : 0,
            nodeCount: nodesArray.length,
            activeNodeCount: activeNodes.length
        };
    }

    /**
     * Get current physics configuration (read-only copy)
     * @returns Copy of the current physics configuration
     */
    getConfig(): PhysicsConfig {
        return { ...this.config };
    }

    /**
     * Reset all forces to zero for given nodes
     * @param nodes - Map of nodes by ID
     */
    resetForces<T extends NodeData>(nodes: Map<string, Node<T>>): void {
        const nodesArray = Array.from(nodes.values());
        nodesArray.forEach(node => node.resetForce());
    }

    /**
     * Apply external force to a specific node
     * @param nodeId - ID of the node to apply force to
     * @param force - Force vector to apply
     * @param nodes - Map of nodes by ID
     * @returns True if force was applied, false if node not found
     */
    applyExternalForce<T extends NodeData>(
        nodeId: string,
        force: Vector,
        nodes: Map<string, Node<T>>
    ): boolean {
        const node = nodes.get(nodeId);
        if (!node) return false;

        node.applyForce(force);
        return true;
    }

    /**
     * Calculate the center of mass for all nodes
     * @param nodes - Map of nodes by ID
     * @param filteredNodes - Set of visible node IDs (null = all visible)
     * @returns Center of mass position
     */
    calculateCenterOfMass<T extends NodeData>(
        nodes: Map<string, Node<T>>,
        filteredNodes: Set<string> | null = null
    ): Vector {
        const nodesArray = Array.from(nodes.values());
        const activeNodes = filteredNodes
            ? nodesArray.filter(node => filteredNodes.has(node.getId()))
            : nodesArray;

        if (activeNodes.length === 0) return new Vector();

        const sum = activeNodes.reduce((acc, node) => acc.add(node.position), new Vector());

        return sum.divide(activeNodes.length);
    }

    /**
     * Apply centering force to pull all nodes toward the center of mass
     * @param nodes - Map of nodes by ID
     * @param filteredNodes - Set of visible node IDs (null = all visible)
     * @param strength - Strength of the centering force (default: 0.001)
     */
    applyCenteringForce<T extends NodeData>(
        nodes: Map<string, Node<T>>,
        filteredNodes: Set<string> | null = null,
        strength: number = 0.001
    ): void {
        const centerOfMass = this.calculateCenterOfMass(nodes, filteredNodes);
        const nodesArray = Array.from(nodes.values());
        const activeNodes = filteredNodes
            ? nodesArray.filter(node => filteredNodes.has(node.getId()))
            : nodesArray;

        activeNodes.forEach(node => {
            if (node.isFixed) return;

            const toCenter = centerOfMass.subtract(node.position);
            const distance = toCenter.magnitude();

            if (distance > 0) {
                const centeringForce = toCenter.normalize().multiply(strength * distance);
                node.applyForce(centeringForce);
            }
        });
    }

    /**
     * Check if the simulation has reached equilibrium
     * @param metrics - Current simulation metrics
     * @param threshold - Energy threshold for equilibrium (default: 0.1)
     * @returns True if system is in equilibrium
     */
    isInEquilibrium(metrics: SimulationMetrics, threshold: number = 0.1): boolean {
        return metrics.totalEnergy < threshold && metrics.maxForce < threshold;
    }

    /**
     * Create a physics link from source and target node IDs
     * @param sourceId - Source node ID
     * @param targetId - Target node ID
     * @param nodes - Map of nodes by ID
     * @param weight - Optional link weight
     * @returns Physics link object or null if nodes not found
     */
    static createLink<T extends NodeData>(
        sourceId: string,
        targetId: string,
        nodes: Map<string, Node<T>>,
        weight?: number
    ): PhysicsLink<T> | null {
        const source = nodes.get(sourceId);
        const target = nodes.get(targetId);

        if (!source || !target) return null;

        return { source, target, weight };
    }

    /**
     * Create multiple physics links from link data
     * @param linkData - Array of link data with source/target IDs
     * @param nodes - Map of nodes by ID
     * @returns Array of valid physics links
     */
    static createLinks<T extends NodeData>(
        linkData: Array<{ source: string; target: string; weight?: number }>,
        nodes: Map<string, Node<T>>
    ): PhysicsLink<T>[] {
        return linkData
            .map(data => PhysicsEngine.createLink(data.source, data.target, nodes, data.weight))
            .filter((link): link is PhysicsLink<T> => link !== null);
    }

    /**
     * Convert this engine to a serializable object for debugging
     * @returns Object representation of the physics engine state
     */
    toObject(): {
        config: PhysicsConfig;
        type: string;
        version: string;
    } {
        return {
            config: this.getConfig(),
            type: 'PhysicsEngine',
            version: '2.0.0'
        };
    }

    /**
     * Create a string representation of the physics engine
     * @returns String representation
     */
    toString(): string {
        return `PhysicsEngine(damping: ${this.config.damping}, repulsion: ${this.config.repulsionStrength})`;
    }
}
