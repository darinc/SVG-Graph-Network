/**
 * PhysicsManager Tests
 * 
 * Tests the physics integration layer that extracts physics responsibilities 
 * from the GraphNetwork God Object.
 */

import { PhysicsManager, GraphLink, RawLinkData } from '../../../src/physics/PhysicsManager';
import { Node } from '../../../src/Node';
import { Vector } from '../../../src/Vector';
import { NodeData, PhysicsConfig } from '../../../src/types/index';

describe('PhysicsManager', () => {
    let physicsManager: PhysicsManager<NodeData>;
    let mockNodes: Map<string, Node<NodeData>>;
    let mockLinks: GraphLink<NodeData>[];
    let filteredNodes: Set<string>;

    beforeEach(() => {
        // Create mock nodes
        const node1 = new Node<NodeData>({
            id: 'node1',
            name: 'Node 1',
            type: 'default'
        }, 800, 600);
        node1.position = new Vector(100, 100);

        const node2 = new Node<NodeData>({
            id: 'node2',
            name: 'Node 2',
            type: 'default'
        }, 800, 600);
        node2.position = new Vector(200, 200);

        const node3 = new Node<NodeData>({
            id: 'node3',
            name: 'Node 3',
            type: 'default'
        }, 800, 600);
        node3.position = new Vector(300, 300);

        mockNodes = new Map([
            ['node1', node1],
            ['node2', node2],
            ['node3', node3]
        ]);

        // Create mock links
        mockLinks = [
            { source: node1, target: node2, weight: 1.0 },
            { source: node2, target: node3, weight: 0.5 }
        ];

        filteredNodes = new Set(['node1', 'node2', 'node3']);

        // Create physics manager with test config
        const config: Partial<PhysicsConfig> = {
            damping: 0.9,
            repulsionStrength: 1000,
            attractionStrength: 0.001
        };
        physicsManager = new PhysicsManager(config);
    });

    afterEach(() => {
        physicsManager.destroy();
    });

    describe('Initialization', () => {
        test('should create PhysicsManager with default config', () => {
            const manager = new PhysicsManager();
            expect(manager).toBeDefined();
            expect(manager.isActive()).toBeFalsy();
        });

        test('should create PhysicsManager with custom config', () => {
            const config: Partial<PhysicsConfig> = {
                damping: 0.8,
                repulsionStrength: 2000
            };
            const manager = new PhysicsManager(config);
            expect(manager).toBeDefined();
            expect(manager.getConfig().damping).toBe(0.8);
            expect(manager.getConfig().repulsionStrength).toBe(2000);
        });

        test('should create PhysicsManager using factory method', () => {
            const manager = PhysicsManager.create<NodeData>();
            expect(manager).toBeDefined();
            expect(manager.isActive()).toBeFalsy();
        });
    });

    describe('Simulation State Management', () => {
        test('should start simulation', () => {
            expect(physicsManager.isActive()).toBeFalsy();
            
            physicsManager.start();
            
            expect(physicsManager.isActive()).toBeTruthy();
            const metrics = physicsManager.getMetrics();
            expect(metrics.isSimulating).toBeTruthy();
            expect(metrics.isPaused).toBeFalsy();
            expect(metrics.isActive).toBeTruthy();
        });

        test('should stop simulation', () => {
            physicsManager.start();
            expect(physicsManager.isActive()).toBeTruthy();
            
            physicsManager.stop();
            
            expect(physicsManager.isActive()).toBeFalsy();
            const metrics = physicsManager.getMetrics();
            expect(metrics.isSimulating).toBeFalsy();
            expect(metrics.isPaused).toBeFalsy();
            expect(metrics.isActive).toBeFalsy();
        });

        test('should pause and resume simulation', () => {
            physicsManager.start();
            expect(physicsManager.isActive()).toBeTruthy();
            
            physicsManager.pause();
            expect(physicsManager.isActive()).toBeFalsy();
            
            const metrics = physicsManager.getMetrics();
            expect(metrics.isSimulating).toBeTruthy();
            expect(metrics.isPaused).toBeTruthy();
            expect(metrics.isActive).toBeFalsy();
            
            physicsManager.resume();
            expect(physicsManager.isActive()).toBeTruthy();
        });

        test('should not resume if not simulating', () => {
            expect(physicsManager.isActive()).toBeFalsy();
            
            physicsManager.resume();
            
            expect(physicsManager.isActive()).toBeFalsy();
        });

        test('should reset simulation state', () => {
            physicsManager.start();
            physicsManager.pause();
            
            physicsManager.reset();
            
            const metrics = physicsManager.getMetrics();
            expect(metrics.isSimulating).toBeFalsy();
            expect(metrics.isPaused).toBeFalsy();
            expect(metrics.isActive).toBeFalsy();
        });
    });

    describe('Physics Simulation Steps', () => {
        beforeEach(() => {
            physicsManager.start();
        });

        test('should execute simulation step when active', () => {
            const result = physicsManager.simulateStep(mockNodes, mockLinks, filteredNodes);
            
            expect(result).toBeTruthy();
        });

        test('should skip simulation step when inactive', () => {
            physicsManager.stop();
            
            const result = physicsManager.simulateStep(mockNodes, mockLinks, filteredNodes);
            
            expect(result).toBeFalsy();
        });

        test('should skip simulation step when paused', () => {
            physicsManager.pause();
            
            const result = physicsManager.simulateStep(mockNodes, mockLinks, filteredNodes);
            
            expect(result).toBeFalsy();
        });

        test('should handle empty node maps', () => {
            const emptyNodes = new Map<string, Node<NodeData>>();
            const emptyFiltered = new Set<string>();
            
            const result = physicsManager.simulateStep(emptyNodes, [], emptyFiltered);
            
            expect(result).toBeTruthy(); // Should still execute even with no nodes
        });

        test('should handle empty links', () => {
            const result = physicsManager.simulateStep(mockNodes, [], filteredNodes);
            
            expect(result).toBeTruthy();
        });

        test('should filter out invalid links', () => {
            const invalidNode = new Node<NodeData>({
                id: 'invalid',
                name: 'Invalid'
            }, 800, 600);
            
            const invalidLinks: GraphLink<NodeData>[] = [
                { source: mockNodes.get('node1')!, target: invalidNode }, // Target not in nodes map
                { source: mockNodes.get('node1')!, target: mockNodes.get('node2')! } // Valid link
            ];
            
            const result = physicsManager.simulateStep(mockNodes, invalidLinks, filteredNodes);
            
            expect(result).toBeTruthy();
        });
    });

    describe('Raw Links Simulation', () => {
        beforeEach(() => {
            physicsManager.start();
        });

        test('should simulate with raw link data', () => {
            const rawLinks: RawLinkData[] = [
                { source: 'node1', target: 'node2', weight: 1.0 },
                { source: 'node2', target: 'node3', weight: 0.5 }
            ];
            
            const result = physicsManager.simulateStepWithRawLinks(mockNodes, rawLinks, filteredNodes);
            
            expect(result).toBeTruthy();
        });

        test('should handle invalid raw links', () => {
            const rawLinks: RawLinkData[] = [
                { source: 'node1', target: 'nonexistent' },
                { source: 'node1', target: 'node2' }
            ];
            
            const result = physicsManager.simulateStepWithRawLinks(mockNodes, rawLinks, filteredNodes);
            
            expect(result).toBeTruthy();
        });

        test('should skip raw links simulation when inactive', () => {
            physicsManager.stop();
            
            const rawLinks: RawLinkData[] = [
                { source: 'node1', target: 'node2' }
            ];
            
            const result = physicsManager.simulateStepWithRawLinks(mockNodes, rawLinks, filteredNodes);
            
            expect(result).toBeFalsy();
        });
    });

    describe('Configuration Management', () => {
        test('should update configuration', () => {
            const newConfig: Partial<PhysicsConfig> = {
                damping: 0.7,
                repulsionStrength: 3000
            };
            
            physicsManager.updateConfig(newConfig);
            
            const config = physicsManager.getConfig();
            expect(config.damping).toBe(0.7);
            expect(config.repulsionStrength).toBe(3000);
        });

        test('should preserve existing config when updating partial config', () => {
            const originalConfig = physicsManager.getConfig();
            const originalAttraction = originalConfig.attractionStrength;
            
            physicsManager.updateConfig({ damping: 0.85 });
            
            const updatedConfig = physicsManager.getConfig();
            expect(updatedConfig.damping).toBe(0.85);
            expect(updatedConfig.attractionStrength).toBe(originalAttraction);
        });
    });

    describe('Metrics and Monitoring', () => {
        test('should provide accurate simulation metrics', () => {
            let metrics = physicsManager.getMetrics();
            expect(metrics.isSimulating).toBeFalsy();
            expect(metrics.isPaused).toBeFalsy();
            expect(metrics.isActive).toBeFalsy();
            
            physicsManager.start();
            metrics = physicsManager.getMetrics();
            expect(metrics.isSimulating).toBeTruthy();
            expect(metrics.isPaused).toBeFalsy();
            expect(metrics.isActive).toBeTruthy();
            
            physicsManager.pause();
            metrics = physicsManager.getMetrics();
            expect(metrics.isSimulating).toBeTruthy();
            expect(metrics.isPaused).toBeTruthy();
            expect(metrics.isActive).toBeFalsy();
            
            physicsManager.stop();
            metrics = physicsManager.getMetrics();
            expect(metrics.isSimulating).toBeFalsy();
            expect(metrics.isPaused).toBeFalsy();
            expect(metrics.isActive).toBeFalsy();
        });
    });

    describe('Integration with PhysicsEngine', () => {
        test('should properly initialize underlying PhysicsEngine', () => {
            const config = physicsManager.getConfig();
            
            // Verify that config properties are accessible
            expect(typeof config.damping).toBe('number');
            expect(typeof config.repulsionStrength).toBe('number');
            expect(typeof config.attractionStrength).toBe('number');
        });

        test('should delegate config updates to PhysicsEngine', () => {
            const originalDamping = physicsManager.getConfig().damping;
            const newDamping = originalDamping * 0.8;
            
            physicsManager.updateConfig({ damping: newDamping });
            
            expect(physicsManager.getConfig().damping).toBe(newDamping);
        });
    });

    describe('Resource Management', () => {
        test('should clean up resources on destroy', () => {
            physicsManager.start();
            expect(physicsManager.isActive()).toBeTruthy();
            
            physicsManager.destroy();
            
            expect(physicsManager.isActive()).toBeFalsy();
        });

        test('should handle multiple destroy calls gracefully', () => {
            expect(() => {
                physicsManager.destroy();
                physicsManager.destroy();
            }).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        test('should handle null/undefined nodes gracefully', () => {
            const sparseNodes = new Map<string, Node<NodeData>>();
            sparseNodes.set('node1', mockNodes.get('node1')!);
            // node2 and node3 missing
            
            physicsManager.start();
            
            expect(() => {
                physicsManager.simulateStep(sparseNodes, mockLinks, new Set(['node1']));
            }).not.toThrow();
        });

        test('should handle empty filtered nodes set', () => {
            physicsManager.start();
            
            const result = physicsManager.simulateStep(mockNodes, mockLinks, new Set());
            
            expect(result).toBeTruthy();
        });

        test('should handle filtered nodes that don\'t exist in nodes map', () => {
            physicsManager.start();
            const invalidFiltered = new Set(['node1', 'nonexistent', 'node2']);
            
            const result = physicsManager.simulateStep(mockNodes, mockLinks, invalidFiltered);
            
            expect(result).toBeTruthy();
        });
    });
});