import { Node } from '../Node';
import { NodeData, PhysicsConfig } from '../types/index';
import { PhysicsEngine, SimulationMetrics, PhysicsLink } from './PhysicsEngine';
import { LayoutStrategy } from './LayoutStrategy';

/**
 * Force-directed layout using the existing PhysicsEngine.
 * This is the default layout strategy — wraps PhysicsEngine
 * to conform to the LayoutStrategy interface.
 */
export class ForceDirectedLayout<T extends NodeData = NodeData> implements LayoutStrategy<T> {
    private engine: PhysicsEngine;

    constructor(config: Partial<PhysicsConfig> = {}) {
        this.engine = new PhysicsEngine(config);
    }

    tick(
        nodes: Map<string, Node<T>>,
        links: PhysicsLink<T>[],
        filteredNodes: Set<string> | null
    ): SimulationMetrics {
        const metrics = this.engine.updateForces(nodes, links, filteredNodes);
        this.engine.updatePositions(nodes, filteredNodes);
        return metrics;
    }

    isStable(metrics: SimulationMetrics): boolean {
        return this.engine.isInEquilibrium(metrics);
    }

    updateConfig(config: Partial<PhysicsConfig>): void {
        this.engine.updateConfig(config);
    }

    getConfig(): PhysicsConfig {
        return this.engine.getConfig();
    }
}
