import { Node } from '../Node';
import { NodeData, PhysicsConfig } from '../types/index';
import { SimulationMetrics, PhysicsLink } from './PhysicsEngine';

/**
 * Interface for pluggable layout algorithms.
 * The default is ForceDirectedLayout (wraps PhysicsEngine).
 * Implement this to provide tree, radial, grid, or other layouts.
 */
export interface LayoutStrategy<T extends NodeData = NodeData> {
    /** Run one simulation tick. Returns metrics for equilibrium detection. */
    tick(
        nodes: Map<string, Node<T>>,
        links: PhysicsLink<T>[],
        filteredNodes: Set<string> | null
    ): SimulationMetrics;

    /** Check if the layout has reached a stable state. */
    isStable(metrics: SimulationMetrics): boolean;

    /** Update layout configuration. */
    updateConfig(config: Partial<PhysicsConfig>): void;

    /** Get current configuration. */
    getConfig(): PhysicsConfig;
}

/**
 * A static layout that does nothing — nodes stay where they are.
 * Useful for pre-computed layouts and testing.
 */
export class StaticLayout<T extends NodeData = NodeData> implements LayoutStrategy<T> {
    tick(): SimulationMetrics {
        return {
            totalEnergy: 0,
            maxForce: 0,
            averageForce: 0,
            nodeCount: 0,
            activeNodeCount: 0
        };
    }

    isStable(): boolean {
        return true;
    }

    updateConfig(): void {
        // No-op for static layout
    }

    getConfig(): PhysicsConfig {
        return {
            damping: 0,
            repulsionStrength: 0,
            attractionStrength: 0,
            groupingStrength: 0
        };
    }
}
