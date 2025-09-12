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
export declare class PhysicsEngine {
    private readonly config;
    /**
     * Create a new PhysicsEngine instance
     * @param config - Physics configuration parameters
     */
    constructor(config?: Partial<PhysicsConfig>);
    /**
     * Update configuration parameters
     * @param newConfig - Partial configuration to merge with existing config
     */
    updateConfig(newConfig: Partial<PhysicsConfig>): void;
    /**
     * Calculate repulsion and attraction forces for all nodes
     * @param nodes - Map of nodes by ID
     * @param links - Array of physics link objects
     * @param filteredNodes - Set of visible node IDs (null = all visible)
     * @returns Simulation metrics for analysis
     */
    updateForces<T extends NodeData>(nodes: Map<string, Node<T>>, links: PhysicsLink<T>[], filteredNodes?: Set<string> | null): SimulationMetrics;
    /**
     * Update node positions based on calculated forces
     * @param nodes - Map of nodes by ID
     * @param filteredNodes - Set of visible node IDs (null = all visible)
     * @param deltaTime - Time step for integration (default: 1)
     */
    updatePositions<T extends NodeData>(nodes: Map<string, Node<T>>, filteredNodes?: Set<string> | null, deltaTime?: number): void;
    /**
     * Calculate repulsion force between two nodes
     * @private
     */
    private _calculateRepulsionForce;
    /**
     * Calculate grouping force for nodes of the same type
     * @private
     */
    private _calculateGroupingForce;
    /**
     * Calculate attraction force between connected nodes
     * @private
     */
    private _calculateAttractionForce;
    /**
     * Calculate simulation metrics for analysis and debugging
     * @private
     */
    private _calculateMetrics;
    /**
     * Get current physics configuration (read-only copy)
     * @returns Copy of the current physics configuration
     */
    getConfig(): PhysicsConfig;
    /**
     * Reset all forces to zero for given nodes
     * @param nodes - Map of nodes by ID
     */
    resetForces<T extends NodeData>(nodes: Map<string, Node<T>>): void;
    /**
     * Apply external force to a specific node
     * @param nodeId - ID of the node to apply force to
     * @param force - Force vector to apply
     * @param nodes - Map of nodes by ID
     * @returns True if force was applied, false if node not found
     */
    applyExternalForce<T extends NodeData>(nodeId: string, force: Vector, nodes: Map<string, Node<T>>): boolean;
    /**
     * Calculate the center of mass for all nodes
     * @param nodes - Map of nodes by ID
     * @param filteredNodes - Set of visible node IDs (null = all visible)
     * @returns Center of mass position
     */
    calculateCenterOfMass<T extends NodeData>(nodes: Map<string, Node<T>>, filteredNodes?: Set<string> | null): Vector;
    /**
     * Apply centering force to pull all nodes toward the center of mass
     * @param nodes - Map of nodes by ID
     * @param filteredNodes - Set of visible node IDs (null = all visible)
     * @param strength - Strength of the centering force (default: 0.001)
     */
    applyCenteringForce<T extends NodeData>(nodes: Map<string, Node<T>>, filteredNodes?: Set<string> | null, strength?: number): void;
    /**
     * Check if the simulation has reached equilibrium
     * @param metrics - Current simulation metrics
     * @param threshold - Energy threshold for equilibrium (default: 0.1)
     * @returns True if system is in equilibrium
     */
    isInEquilibrium(metrics: SimulationMetrics, threshold?: number): boolean;
    /**
     * Create a physics link from source and target node IDs
     * @param sourceId - Source node ID
     * @param targetId - Target node ID
     * @param nodes - Map of nodes by ID
     * @param weight - Optional link weight
     * @returns Physics link object or null if nodes not found
     */
    static createLink<T extends NodeData>(sourceId: string, targetId: string, nodes: Map<string, Node<T>>, weight?: number): PhysicsLink<T> | null;
    /**
     * Create multiple physics links from link data
     * @param linkData - Array of link data with source/target IDs
     * @param nodes - Map of nodes by ID
     * @returns Array of valid physics links
     */
    static createLinks<T extends NodeData>(linkData: Array<{
        source: string;
        target: string;
        weight?: number;
    }>, nodes: Map<string, Node<T>>): PhysicsLink<T>[];
    /**
     * Convert this engine to a serializable object for debugging
     * @returns Object representation of the physics engine state
     */
    toObject(): {
        config: PhysicsConfig;
        type: string;
        version: string;
    };
    /**
     * Create a string representation of the physics engine
     * @returns String representation
     */
    toString(): string;
}
//# sourceMappingURL=PhysicsEngine.d.ts.map