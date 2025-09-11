import { PhysicsEngine } from '../../../src/physics/PhysicsEngine.js';
import { Node } from '../../../src/Node.js';
import { Vector } from '../../../src/Vector.js';
import { createMockNode, createMockPhysicsConfig } from '../../utils/testHelpers.js';

describe('PhysicsEngine', () => {
    let engine;
    let nodes;
    let links;

    beforeEach(() => {
        engine = new PhysicsEngine(createMockPhysicsConfig());
        
        // Create test nodes
        const nodeData1 = createMockNode({ id: 'node1', type: 'primary' });
        const nodeData2 = createMockNode({ id: 'node2', type: 'secondary' });
        const nodeData3 = createMockNode({ id: 'node3', type: 'primary' });
        
        const node1 = new Node(nodeData1, 800, 600);
        const node2 = new Node(nodeData2, 800, 600);
        const node3 = new Node(nodeData3, 800, 600);
        
        // Set predictable positions for testing
        node1.position = new Vector(100, 100);
        node2.position = new Vector(200, 100);
        node3.position = new Vector(100, 200);
        
        nodes = new Map([
            ['node1', node1],
            ['node2', node2],
            ['node3', node3]
        ]);
        
        links = [
            { source: node1, target: node2 },
            { source: node2, target: node3 }
        ];
    });

    describe('constructor', () => {
        test('should create engine with default configuration', () => {
            const defaultEngine = new PhysicsEngine();
            const config = defaultEngine.getConfig();
            
            expect(config.damping).toBe(0.95);
            expect(config.repulsionStrength).toBe(6500);
            expect(config.attractionStrength).toBe(0.001);
            expect(config.groupingStrength).toBe(0.001);
        });

        test('should create engine with custom configuration', () => {
            const customConfig = {
                damping: 0.9,
                repulsionStrength: 5000,
                attractionStrength: 0.002,
                groupingStrength: 0.003
            };
            
            const customEngine = new PhysicsEngine(customConfig);
            const config = customEngine.getConfig();
            
            expect(config.damping).toBe(0.9);
            expect(config.repulsionStrength).toBe(5000);
            expect(config.attractionStrength).toBe(0.002);
            expect(config.groupingStrength).toBe(0.003);
        });

        test('should merge custom config with defaults', () => {
            const partialConfig = { damping: 0.8 };
            const customEngine = new PhysicsEngine(partialConfig);
            const config = customEngine.getConfig();
            
            expect(config.damping).toBe(0.8);
            expect(config.repulsionStrength).toBe(6500); // default
            expect(config.attractionStrength).toBe(0.001); // default
            expect(config.groupingStrength).toBe(0.001); // default
        });
    });

    describe('updateConfig', () => {
        test('should update configuration parameters', () => {
            const newConfig = { damping: 0.85, repulsionStrength: 7000 };
            
            engine.updateConfig(newConfig);
            const config = engine.getConfig();
            
            expect(config.damping).toBe(0.85);
            expect(config.repulsionStrength).toBe(7000);
            expect(config.attractionStrength).toBe(0.001); // unchanged
        });

        test('should preserve existing config when updating', () => {
            const originalConfig = engine.getConfig();
            engine.updateConfig({ damping: 0.8 });
            const newConfig = engine.getConfig();
            
            expect(newConfig.damping).toBe(0.8);
            expect(newConfig.repulsionStrength).toBe(originalConfig.repulsionStrength);
            expect(newConfig.attractionStrength).toBe(originalConfig.attractionStrength);
            expect(newConfig.groupingStrength).toBe(originalConfig.groupingStrength);
        });
    });

    describe('getConfig', () => {
        test('should return a copy of the configuration', () => {
            const config1 = engine.getConfig();
            const config2 = engine.getConfig();
            
            expect(config1).toEqual(config2);
            expect(config1).not.toBe(config2); // Different objects
        });

        test('should not allow external modification of config', () => {
            const config = engine.getConfig();
            config.damping = 0.5;
            
            const internalConfig = engine.getConfig();
            expect(internalConfig.damping).not.toBe(0.5);
        });
    });

    describe('updateForces', () => {
        test('should reset all node forces before calculation', () => {
            // Set some initial forces
            nodes.get('node1').force = new Vector(10, 20);
            nodes.get('node2').force = new Vector(30, 40);
            
            engine.updateForces(nodes, links);
            
            // Forces should be different from the initial values (they got reset and recalculated)
            expect(nodes.get('node1').force.x).not.toBe(10);
            expect(nodes.get('node1').force.y).not.toBe(20);
        });

        test('should calculate forces for all nodes when no filter applied', () => {
            engine.updateForces(nodes, links);
            
            // All nodes should have some force applied
            nodes.forEach(node => {
                const forceMagnitude = node.force.magnitude();
                expect(forceMagnitude).toBeGreaterThan(0);
            });
        });

        test('should only calculate forces for filtered nodes', () => {
            const filteredNodes = new Set(['node1', 'node2']);
            
            engine.updateForces(nodes, links, filteredNodes);
            
            // Node3 should have zero force since it's filtered out
            const node3Force = nodes.get('node3').force.magnitude();
            expect(node3Force).toBe(0);
        });

        test('should apply repulsion forces between all node pairs', () => {
            // Place nodes closer together to get stronger repulsion
            nodes.get('node1').position = new Vector(100, 100);
            nodes.get('node2').position = new Vector(105, 100); // Very close
            
            engine.updateForces(nodes, links);
            
            const node1Force = nodes.get('node1').force;
            const node2Force = nodes.get('node2').force;
            
            // Node1 should be pushed left (negative x), Node2 pushed right (positive x)
            expect(node1Force.x).toBeLessThan(0);
            expect(node2Force.x).toBeGreaterThan(0);
        });

        test('should apply attraction forces for connected nodes', () => {
            // Place connected nodes far apart
            nodes.get('node1').position = new Vector(0, 0);
            nodes.get('node2').position = new Vector(1000, 0);
            
            // Clear other nodes to isolate the test
            const isolatedNodes = new Map([
                ['node1', nodes.get('node1')],
                ['node2', nodes.get('node2')]
            ]);
            const isolatedLinks = [{ source: nodes.get('node1'), target: nodes.get('node2') }];
            
            engine.updateForces(isolatedNodes, isolatedLinks);
            
            const node1Force = isolatedNodes.get('node1').force;
            const node2Force = isolatedNodes.get('node2').force;
            
            // Nodes should attract each other
            expect(node1Force.x).toBeGreaterThan(0); // Pull towards node2
            expect(node2Force.x).toBeLessThan(0);    // Pull towards node1
        });

        test('should apply grouping forces for same-type nodes', () => {
            // Create two nodes of the same type far apart
            const sameTypeNode1 = nodes.get('node1'); // type: 'primary'
            const sameTypeNode3 = nodes.get('node3'); // type: 'primary'
            
            sameTypeNode1.position = new Vector(0, 0);
            sameTypeNode3.position = new Vector(1000, 1000);
            
            const isolatedNodes = new Map([
                ['node1', sameTypeNode1],
                ['node3', sameTypeNode3]
            ]);
            
            engine.updateForces(isolatedNodes, []);
            
            const node1Force = sameTypeNode1.force;
            const node3Force = sameTypeNode3.force;
            
            // Should have some grouping force (though weaker than repulsion)
            expect(node1Force.magnitude()).toBeGreaterThan(0);
            expect(node3Force.magnitude()).toBeGreaterThan(0);
        });
    });

    describe('updatePositions', () => {
        test('should update positions based on forces and velocity', () => {
            // Set initial force and velocity
            const node = nodes.get('node1');
            const initialPosition = new Vector(node.position.x, node.position.y);
            node.force = new Vector(100, 0);
            node.velocity = new Vector(10, 0);
            
            engine.updatePositions(nodes);
            
            expect(node.position.x).toBeGreaterThan(initialPosition.x);
            expect(node.velocity.x).toBeGreaterThan(10); // Should have increased due to force
        });

        test('should apply damping to velocity', () => {
            const node = nodes.get('node1');
            node.velocity = new Vector(100, 100);
            node.force = new Vector(0, 0); // No new force
            
            const initialSpeed = node.velocity.magnitude();
            
            engine.updatePositions(nodes);
            
            const newSpeed = node.velocity.magnitude();
            expect(newSpeed).toBeLessThan(initialSpeed);
            expect(newSpeed).toBeCloseTo(initialSpeed * engine.config.damping);
        });

        test('should not move fixed nodes', () => {
            const node = nodes.get('node1');
            const initialPosition = new Vector(node.position.x, node.position.y);
            
            node.fix();
            node.force = new Vector(1000, 1000); // Large force
            
            engine.updatePositions(nodes);
            
            expect(node.position.x).toBe(initialPosition.x);
            expect(node.position.y).toBe(initialPosition.y);
        });

        test('should not move filtered out nodes', () => {
            const node = nodes.get('node3');
            const initialPosition = new Vector(node.position.x, node.position.y);
            
            node.force = new Vector(1000, 1000);
            const filteredNodes = new Set(['node1', 'node2']); // node3 filtered out
            
            engine.updatePositions(nodes, filteredNodes);
            
            expect(node.position.x).toBe(initialPosition.x);
            expect(node.position.y).toBe(initialPosition.y);
        });

        test('should integrate forces into velocity correctly', () => {
            const node = nodes.get('node1');
            node.velocity = new Vector(5, 10);
            node.force = new Vector(20, 30);
            
            const expectedVelocityX = (5 + 20) * engine.config.damping;
            const expectedVelocityY = (10 + 30) * engine.config.damping;
            
            engine.updatePositions(nodes);
            
            expect(node.velocity.x).toBeCloseTo(expectedVelocityX);
            expect(node.velocity.y).toBeCloseTo(expectedVelocityY);
        });
    });

    describe('force calculations edge cases', () => {
        test('should handle nodes at same position gracefully', () => {
            const node1 = nodes.get('node1');
            const node2 = nodes.get('node2');
            
            // Place nodes at exact same position
            node1.position = new Vector(100, 100);
            node2.position = new Vector(100, 100);
            
            expect(() => {
                engine.updateForces(nodes, links);
            }).not.toThrow();
            
            // Forces should remain finite
            expect(isFinite(node1.force.x)).toBe(true);
            expect(isFinite(node1.force.y)).toBe(true);
            expect(isFinite(node2.force.x)).toBe(true);
            expect(isFinite(node2.force.y)).toBe(true);
        });

        test('should handle zero grouping strength', () => {
            engine.updateConfig({ groupingStrength: 0 });
            
            expect(() => {
                engine.updateForces(nodes, links);
            }).not.toThrow();
        });

        test('should handle empty nodes and links', () => {
            const emptyNodes = new Map();
            const emptyLinks = [];
            
            expect(() => {
                engine.updateForces(emptyNodes, emptyLinks);
                engine.updatePositions(emptyNodes);
            }).not.toThrow();
        });

        test('should handle very large forces', () => {
            engine.updateConfig({ repulsionStrength: 1e10 });
            
            // Place nodes very close
            nodes.get('node1').position = new Vector(100, 100);
            nodes.get('node2').position = new Vector(100.001, 100);
            
            engine.updateForces(nodes, links);
            
            // Should not produce infinite forces
            nodes.forEach(node => {
                expect(isFinite(node.force.x)).toBe(true);
                expect(isFinite(node.force.y)).toBe(true);
            });
        });
    });

    describe('physics simulation consistency', () => {
        test('should be deterministic for same initial conditions', () => {
            // Set identical initial conditions
            const setupNodes = () => {
                nodes.get('node1').position = new Vector(100, 100);
                nodes.get('node2').position = new Vector(200, 100);
                nodes.get('node1').velocity = new Vector(0, 0);
                nodes.get('node2').velocity = new Vector(0, 0);
            };
            
            setupNodes();
            engine.updateForces(nodes, links);
            const forces1 = {
                node1: new Vector(nodes.get('node1').force.x, nodes.get('node1').force.y),
                node2: new Vector(nodes.get('node2').force.x, nodes.get('node2').force.y)
            };
            
            setupNodes();
            engine.updateForces(nodes, links);
            const forces2 = {
                node1: new Vector(nodes.get('node1').force.x, nodes.get('node1').force.y),
                node2: new Vector(nodes.get('node2').force.x, nodes.get('node2').force.y)
            };
            
            expect(forces1.node1.x).toBeCloseTo(forces2.node1.x);
            expect(forces1.node1.y).toBeCloseTo(forces2.node1.y);
            expect(forces1.node2.x).toBeCloseTo(forces2.node2.x);
            expect(forces1.node2.y).toBeCloseTo(forces2.node2.y);
        });

        test('should conserve momentum in isolated system', () => {
            // Simple two-node system
            const isolatedNodes = new Map([
                ['node1', nodes.get('node1')],
                ['node2', nodes.get('node2')]
            ]);
            
            nodes.get('node1').position = new Vector(0, 0);
            nodes.get('node2').position = new Vector(100, 0);
            nodes.get('node1').velocity = new Vector(0, 0);
            nodes.get('node2').velocity = new Vector(0, 0);
            
            engine.updateForces(isolatedNodes, []);
            
            const totalForceX = nodes.get('node1').force.x + nodes.get('node2').force.x;
            const totalForceY = nodes.get('node1').force.y + nodes.get('node2').force.y;
            
            // Total force should be near zero (Newton's third law)
            expect(Math.abs(totalForceX)).toBeLessThan(1e-10);
            expect(Math.abs(totalForceY)).toBeLessThan(1e-10);
        });
    });
});