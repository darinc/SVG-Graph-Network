/**
 * PhysicsManager - Integration layer for physics simulation
 *
 * Extracted from GraphNetwork to reduce God Object anti-pattern.
 * Provides clean abstraction over PhysicsEngine with graph-specific logic.
 */

import { PhysicsEngine, PhysicsLink } from './PhysicsEngine';
import { Node } from '../Node';
import { NodeData, PhysicsConfig } from '../types/index';

/**
 * Graph link with source/target node references
 */
export interface GraphLink<T extends NodeData = NodeData> {
    source: Node<T>;
    target: Node<T>;
    weight?: number;
}

/**
 * Raw link data with string IDs
 */
export interface RawLinkData {
    source: string;
    target: string;
    weight?: number;
}

/**
 * PhysicsManager handles physics simulation for graph networks
 *
 * Responsibilities:
 * - Manages PhysicsEngine lifecycle
 * - Converts graph data to physics format
 * - Handles simulation state (running/paused)
 * - Provides configuration updates
 * - Tracks simulation metrics
 */
export class PhysicsManager<T extends NodeData = NodeData> {
    private engine: PhysicsEngine;
    private isSimulating = false;
    private isPaused = false;

    constructor(config: Partial<PhysicsConfig> = {}) {
        this.engine = new PhysicsEngine(config);
    }

    /**
     * Start physics simulation
     */
    start(): void {
        this.isSimulating = true;
        this.isPaused = false;
    }

    /**
     * Stop physics simulation
     */
    stop(): void {
        this.isSimulating = false;
        this.isPaused = false;
    }

    /**
     * Pause physics simulation (can be resumed)
     */
    pause(): void {
        this.isPaused = true;
    }

    /**
     * Resume paused physics simulation
     */
    resume(): void {
        if (this.isSimulating) {
            this.isPaused = false;
        }
    }

    /**
     * Check if simulation is currently active
     */
    isActive(): boolean {
        return this.isSimulating && !this.isPaused;
    }

    /**
     * Run one physics simulation step
     *
     * @param nodes - Map of all nodes in the graph
     * @param links - Array of graph links
     * @param filteredNodes - Set of visible node IDs
     * @returns true if simulation step was executed, false if skipped
     */
    simulateStep(
        nodes: Map<string, Node<T>>,
        links: GraphLink<T>[],
        filteredNodes: Set<string>
    ): boolean {
        if (!this.isActive()) {
            return false;
        }

        // Convert graph links to physics links
        const physicsLinks = this.convertToPhysicsLinks(links, nodes);

        // Run physics simulation
        this.engine.updateForces(nodes, physicsLinks, filteredNodes);
        this.engine.updatePositions(nodes, filteredNodes);

        return true;
    }

    /**
     * Simulate step with raw link data (for backward compatibility)
     */
    simulateStepWithRawLinks(
        nodes: Map<string, Node<T>>,
        rawLinks: RawLinkData[],
        filteredNodes: Set<string>
    ): boolean {
        if (!this.isActive()) {
            return false;
        }

        // Use PhysicsEngine's static method to create links
        const physicsLinks = PhysicsEngine.createLinks(rawLinks, nodes);

        // Run physics simulation
        this.engine.updateForces(nodes, physicsLinks, filteredNodes);
        this.engine.updatePositions(nodes, filteredNodes);

        return true;
    }

    /**
     * Update physics configuration
     */
    updateConfig(config: Partial<PhysicsConfig>): void {
        this.engine.updateConfig(config);
    }

    /**
     * Get current physics configuration
     */
    getConfig(): PhysicsConfig {
        return this.engine.getConfig();
    }

    /**
     * Get simulation metrics
     */
    getMetrics(): {
        isSimulating: boolean;
        isPaused: boolean;
        isActive: boolean;
    } {
        return {
            isSimulating: this.isSimulating,
            isPaused: this.isPaused,
            isActive: this.isActive()
        };
    }

    /**
     * Reset physics state (stop all motion)
     */
    reset(): void {
        this.stop();
        // The PhysicsEngine will handle velocity/force reset when simulation restarts
    }

    /**
     * Convert graph links to physics links format
     * @private
     */
    private convertToPhysicsLinks(
        links: GraphLink<T>[],
        nodes: Map<string, Node<T>>
    ): PhysicsLink<T>[] {
        return links
            .filter(link => {
                // Ensure both nodes exist in the graph
                const sourceExists = nodes.has(link.source.getId());
                const targetExists = nodes.has(link.target.getId());
                return sourceExists && targetExists;
            })
            .map(link => ({
                source: link.source,
                target: link.target,
                weight: link.weight
            }));
    }

    /**
     * Factory method to create PhysicsManager with default configuration
     */
    static create<T extends NodeData = NodeData>(
        config: Partial<PhysicsConfig> = {}
    ): PhysicsManager<T> {
        return new PhysicsManager<T>(config);
    }

    /**
     * Clean up physics manager resources
     */
    destroy(): void {
        this.stop();
        // PhysicsEngine doesn't have explicit cleanup currently
    }
}
