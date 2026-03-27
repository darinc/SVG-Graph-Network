import { ForceDirectedLayout } from '../../../src/physics/ForceDirectedLayout';
import { StaticLayout } from '../../../src/physics/LayoutStrategy';
import { Node } from '../../../src/Node';
import { NodeData } from '../../../src/types/index';
import { Vector } from '../../../src/Vector';

describe('ForceDirectedLayout', () => {
    let layout: ForceDirectedLayout;

    beforeEach(() => {
        layout = new ForceDirectedLayout();
    });

    test('should return simulation metrics from tick', () => {
        const nodes = new Map<string, Node<NodeData>>();
        const node1 = new Node<NodeData>({ id: '1', name: 'A' }, 800, 600);
        const node2 = new Node<NodeData>({ id: '2', name: 'B' }, 800, 600);
        node1.position = new Vector(0, 0);
        node2.position = new Vector(100, 100);
        nodes.set('1', node1);
        nodes.set('2', node2);

        const metrics = layout.tick(nodes, [], null);

        expect(metrics).toHaveProperty('totalEnergy');
        expect(metrics).toHaveProperty('maxForce');
        expect(metrics).toHaveProperty('averageForce');
        expect(metrics).toHaveProperty('nodeCount');
        expect(metrics.nodeCount).toBe(2);
    });

    test('should detect stability when forces are low', () => {
        const metrics = {
            totalEnergy: 0.001,
            maxForce: 0.001,
            averageForce: 0,
            nodeCount: 2,
            activeNodeCount: 2
        };
        expect(layout.isStable(metrics)).toBe(true);
    });

    test('should detect instability when forces are high', () => {
        const metrics = {
            totalEnergy: 100,
            maxForce: 50,
            averageForce: 25,
            nodeCount: 2,
            activeNodeCount: 2
        };
        expect(layout.isStable(metrics)).toBe(false);
    });

    test('should update and return config', () => {
        layout.updateConfig({ damping: 0.5 });
        const config = layout.getConfig();
        expect(config.damping).toBe(0.5);
    });
});

describe('StaticLayout', () => {
    let layout: StaticLayout;

    beforeEach(() => {
        layout = new StaticLayout();
    });

    test('should return zero-energy metrics', () => {
        const metrics = layout.tick();
        expect(metrics.totalEnergy).toBe(0);
        expect(metrics.maxForce).toBe(0);
    });

    test('should always be stable', () => {
        expect(layout.isStable()).toBe(true);
    });

    test('should not move nodes', () => {
        const nodes = new Map<string, Node<NodeData>>();
        const node = new Node<NodeData>({ id: '1', name: 'A' }, 800, 600);
        node.position = new Vector(42, 84);
        nodes.set('1', node);

        layout.tick();

        expect(node.position.x).toBe(42);
        expect(node.position.y).toBe(84);
    });
});
