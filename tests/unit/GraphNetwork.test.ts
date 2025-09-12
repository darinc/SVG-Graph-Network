/**
 * Comprehensive test suite for GraphNetwork class
 * Covers Phase 3 & Phase 4 APIs with extensive validation and error handling tests
 */

import { GraphNetwork } from '../../src/GraphNetwork';
import { NodeData, LinkData, EdgeData, GraphData } from '../../src/types/index';
import { 
    NodeValidationError, 
    NodeExistsError, 
    NodeNotFoundError,
    EdgeValidationError,
    EdgeExistsError,
    EdgeNotFoundError,
    InvalidEdgeReferencesError
} from '../../src/errors/GraphErrors';
import { createMockContainer, cleanupContainer } from '../utils/testHelpers';


// Sample test data
const sampleNodes: NodeData[] = [
    { id: 'node1', name: 'Node 1', type: 'primary', size: 30 },
    { id: 'node2', name: 'Node 2', type: 'secondary', size: 25 },
    { id: 'node3', name: 'Node 3', type: 'primary', size: 35 }
];

const sampleEdges: LinkData[] = [
    { id: 'edge1', source: 'node1', target: 'node2', weight: 1, label: 'Connection 1' },
    { id: 'edge2', source: 'node2', target: 'node3', weight: 2, label: 'Connection 2' }
];

const sampleGraphData: GraphData = {
    nodes: sampleNodes,
    links: sampleEdges
};

describe('GraphNetwork', () => {
    let graph: GraphNetwork;
    let container: HTMLElement;

    beforeEach(() => {
        // Create a mock container using the helper
        container = createMockContainer('test-container');
        
        // Initialize graph with minimal config
        graph = new GraphNetwork('test-container', {
            config: { 
                showControls: false, 
                showLegend: false,
                showTitle: false,
                showBreadcrumbs: false
            },
            debug: false
        });
    });

    afterEach(() => {
        if (graph) {
            graph.destroy();
        }
        cleanupContainer(container);
    });

    // ==================== Phase 3: Core Data Manipulation APIs ====================

    describe('Phase 3: Enhanced CRUD Operations', () => {
        describe('addNode()', () => {
            it('should add a node with basic data', () => {
                const nodeData: NodeData = { id: 'test1', name: 'Test Node' };
                const node = graph.addNode(nodeData);

                expect(node).toBeDefined();
                expect(node.getId()).toBe('test1');
                expect(node.getName()).toBe('Test Node');
                expect(graph.hasNode('test1')).toBe(true);
            });

            it('should add a node with positioning options', () => {
                const nodeData: NodeData = { id: 'positioned', name: 'Positioned Node' };
                const node = graph.addNode(nodeData, { x: 100, y: 200 });

                expect(node.position.x).toBe(100);
                expect(node.position.y).toBe(200);
            });

            it('should validate required node data', () => {
                expect(() => {
                    graph.addNode({ id: '', name: 'Invalid' } as NodeData);
                }).toThrow(NodeValidationError);

                expect(() => {
                    graph.addNode({ id: 'valid', name: '' } as NodeData);
                }).toThrow(NodeValidationError);
            });

            it('should prevent duplicate node IDs', () => {
                const nodeData: NodeData = { id: 'duplicate', name: 'First Node' };
                graph.addNode(nodeData);

                expect(() => {
                    graph.addNode({ id: 'duplicate', name: 'Second Node' });
                }).toThrow(NodeExistsError);
            });

            it('should validate optional node properties', () => {
                expect(() => {
                    graph.addNode({ id: 'invalid', name: 'Test', size: -5 } as NodeData);
                }).toThrow(NodeValidationError);

                expect(() => {
                    graph.addNode({ id: 'invalid2', name: 'Test', type: 123 } as any);
                }).toThrow(NodeValidationError);
            });

            it('should skip validation when requested', () => {
                const invalidData = { id: '', name: '' } as NodeData;
                expect(() => {
                    graph.addNode(invalidData, { skipValidation: true });
                }).not.toThrow();
            });
        });

        describe('deleteNode()', () => {
            beforeEach(() => {
                graph.clearData();
                graph.setData({
                    nodes: JSON.parse(JSON.stringify(sampleNodes)),
                    links: JSON.parse(JSON.stringify(sampleEdges))
                });
            });

            it('should delete a node and connected edges', () => {
                const result = graph.deleteNode('node1');

                expect(result).toBe(true);
                expect(graph.hasNode('node1')).toBe(false);
                expect(graph.hasEdge('edge1')).toBe(false); // Connected edge should be removed
            });

            it('should throw error for non-existent node', () => {
                expect(() => {
                    graph.deleteNode('nonexistent');
                }).toThrow(NodeNotFoundError);
            });

            it('should handle deletion options', () => {
                const result = graph.deleteNode('node2', { skipRedraw: true });
                expect(result).toBe(true);
                expect(graph.hasNode('node2')).toBe(false);
            });

            it('should maintain backward compatibility with removeNode', () => {
                const result = graph.removeNode('node3');
                expect(result).toBe(true);
                expect(graph.hasNode('node3')).toBe(false);
            });
        });

        describe('addEdge()', () => {
            beforeEach(() => {
                // Add nodes first
                sampleNodes.forEach(node => graph.addNode(node));
            });

            it('should add an edge with full validation', () => {
                const edgeData: EdgeData = {
                    id: 'new-edge',
                    source: 'node1',
                    target: 'node2',
                    weight: 3,
                    label: 'New Connection'
                };

                const edge = graph.addEdge(edgeData);
                expect(edge).toBeDefined();
                expect(graph.hasEdge('new-edge')).toBe(true);
            });

            it('should validate edge data thoroughly', () => {
                expect(() => {
                    graph.addEdge({ id: '', source: 'node1', target: 'node2' });
                }).toThrow(EdgeValidationError);

                expect(() => {
                    graph.addEdge({ id: 'test', source: '', target: 'node2' });
                }).toThrow(EdgeValidationError);

                expect(() => {
                    graph.addEdge({ id: 'test', source: 'node1', target: 'node1' });
                }).toThrow(EdgeValidationError);
            });

            it('should validate node references exist', () => {
                expect(() => {
                    graph.addEdge({
                        id: 'invalid-refs',
                        source: 'nonexistent1',
                        target: 'nonexistent2'
                    });
                }).toThrow(InvalidEdgeReferencesError);
            });

            it('should prevent duplicate edge IDs', () => {
                const edgeData: EdgeData = {
                    id: 'duplicate-edge',
                    source: 'node1',
                    target: 'node2'
                };

                graph.addEdge(edgeData);
                expect(() => {
                    graph.addEdge(edgeData);
                }).toThrow(EdgeExistsError);
            });

            it('should validate optional edge properties', () => {
                expect(() => {
                    graph.addEdge({
                        id: 'invalid-weight',
                        source: 'node1',
                        target: 'node2',
                        weight: -1
                    });
                }).toThrow(EdgeValidationError);

                expect(() => {
                    graph.addEdge({
                        id: 'invalid-line-type',
                        source: 'node1',
                        target: 'node2',
                        line_type: 'invalid' as any
                    });
                }).toThrow(EdgeValidationError);
            });

            it('should maintain backward compatibility with addLink', () => {
                const linkData: LinkData = {
                    source: 'node2',
                    target: 'node3',
                    weight: 2
                };

                const edge = graph.addLink(linkData);
                expect(edge).toBeDefined();
                expect(graph.hasEdge('node2-node3')).toBe(true); // Auto-generated ID
            });
        });

        describe('deleteEdge()', () => {
            beforeEach(() => {
                graph.clearData();
                graph.setData({
                    nodes: JSON.parse(JSON.stringify(sampleNodes)),
                    links: JSON.parse(JSON.stringify(sampleEdges))
                });
            });

            it('should delete edge by ID', () => {
                const result = graph.deleteEdge('edge1');
                expect(result).toBe(true);
                expect(graph.hasEdge('edge1')).toBe(false);
            });

            it('should throw error for non-existent edge', () => {
                expect(() => {
                    graph.deleteEdge('nonexistent');
                }).toThrow(EdgeNotFoundError);
            });

            it('should handle deletion options', () => {
                const result = graph.deleteEdge('edge2', { skipRedraw: true });
                expect(result).toBe(true);
                expect(graph.hasEdge('edge2')).toBe(false);
            });

            it('should maintain backward compatibility with removeLink', () => {
                const result = graph.removeLink('node1', 'node2');
                expect(result).toBe(true);
                expect(graph.hasEdge('edge1')).toBe(false);
            });
        });
    });

    describe('Phase 3: Update Operations', () => {
        beforeEach(() => {
            graph.clearData();
            graph.setData({
                nodes: JSON.parse(JSON.stringify(sampleNodes)),
                links: JSON.parse(JSON.stringify(sampleEdges))
            });
        });

        describe('updateNode()', () => {
            it('should update node properties', () => {
                const result = graph.updateNode('node1', { name: 'Updated Node', size: 40 });
                expect(result).toBe(true);

                const node = graph.getNode('node1');
                expect(node?.name).toBe('Updated Node');
                expect(node?.size).toBe(40);
            });

            it('should validate update data', () => {
                expect(() => {
                    graph.updateNode('node1', { name: '' });
                }).toThrow(NodeValidationError);

                expect(() => {
                    graph.updateNode('node1', { size: -10 });
                }).toThrow(NodeValidationError);
            });

            it('should throw error for non-existent node', () => {
                expect(() => {
                    graph.updateNode('nonexistent', { name: 'New Name' });
                }).toThrow(NodeNotFoundError);
            });
        });

        describe('updateEdge()', () => {
            it('should update edge properties', () => {
                const result = graph.updateEdge('edge1', { label: 'Updated Connection', weight: 5 });
                expect(result).toBe(true);

                const edge = graph.getEdge('edge1');
                expect(edge?.label).toBe('Updated Connection');
                expect(edge?.weight).toBe(5);
            });

            it('should validate update data', () => {
                expect(() => {
                    graph.updateEdge('edge1', { weight: -1 });
                }).toThrow(EdgeValidationError);

                expect(() => {
                    graph.updateEdge('edge1', { line_type: 'invalid' as any });
                }).toThrow(EdgeValidationError);
            });

            it('should throw error for non-existent edge', () => {
                expect(() => {
                    graph.updateEdge('nonexistent', { label: 'New Label' });
                }).toThrow(EdgeNotFoundError);
            });
        });
    });

    describe('Phase 3: Getter Methods', () => {
        beforeEach(() => {
            graph.clearData();
            graph.setData({
                nodes: JSON.parse(JSON.stringify(sampleNodes)),
                links: JSON.parse(JSON.stringify(sampleEdges))
            });
        });

        describe('getNode()', () => {
            it('should return node data', () => {
                const node = graph.getNode('node1');
                expect(node).toBeDefined();
                expect(node?.id).toBe('node1');
                expect(node?.name).toBe('Node 1');
            });

            it('should return null for non-existent node', () => {
                const node = graph.getNode('nonexistent');
                expect(node).toBeNull();
            });

            it('should return a copy of node data', () => {
                const node = graph.getNode('node1');
                node!.name = 'Modified';
                
                const originalNode = graph.getNode('node1');
                expect(originalNode?.name).toBe('Node 1'); // Should not be modified
            });
        });

        describe('getEdge()', () => {
            it('should return edge data', () => {
                const edge = graph.getEdge('edge1');
                expect(edge).toBeDefined();
                expect(edge?.source).toBe('node1');
                expect(edge?.target).toBe('node2');
            });

            it('should return null for non-existent edge', () => {
                const edge = graph.getEdge('nonexistent');
                expect(edge).toBeNull();
            });
        });

        describe('hasNode() and hasEdge()', () => {
            it('should check node existence', () => {
                expect(graph.hasNode('node1')).toBe(true);
                expect(graph.hasNode('nonexistent')).toBe(false);
            });

            it('should check edge existence', () => {
                expect(graph.hasEdge('edge1')).toBe(true);
                expect(graph.hasEdge('nonexistent')).toBe(false);
            });
        });

        describe('getData()', () => {
            it('should return complete graph data', () => {
                const data = graph.getData();
                expect(data.nodes).toHaveLength(3);
                expect(data.links).toHaveLength(2);
                expect(data.nodes[0].id).toBe('node1');
            });
        });
    });

    // ==================== Phase 4: Bulk & Data-Driven Operations ====================

    describe('Phase 4: Bulk Operations', () => {
        beforeEach(() => {
            graph.clearData();
            graph.setData({
                nodes: JSON.parse(JSON.stringify(sampleNodes)),
                links: JSON.parse(JSON.stringify(sampleEdges))
            });
        });

        describe('updateNodes()', () => {
            it('should update multiple nodes in bulk', () => {
                const updates = [
                    { id: 'node1', name: 'Bulk Updated 1', size: 45 },
                    { id: 'node2', name: 'Bulk Updated 2', size: 35 }
                ];

                const updatedIds = graph.updateNodes(updates);
                expect(updatedIds).toEqual(['node1', 'node2']);

                const node1 = graph.getNode('node1');
                const node2 = graph.getNode('node2');
                expect(node1?.name).toBe('Bulk Updated 1');
                expect(node2?.size).toBe(35);
            });

            it('should validate all updates before applying', () => {
                const invalidUpdates = [
                    { id: 'node1', name: 'Valid Update' },
                    { id: 'node2', size: -10 }, // Invalid size
                    { id: 'nonexistent', name: 'Invalid ID' }
                ];

                expect(() => {
                    graph.updateNodes(invalidUpdates);
                }).toThrow();

                // No updates should have been applied
                const node1 = graph.getNode('node1');
                expect(node1?.name).toBe('Node 1'); // Original name
            });

            it('should handle performance options', () => {
                const updates = [
                    { id: 'node1', name: 'Performance Test 1' },
                    { id: 'node2', name: 'Performance Test 2' }
                ];

                const updatedIds = graph.updateNodes(updates, { 
                    skipRedraw: true,
                    skipValidation: false 
                });

                expect(updatedIds).toHaveLength(2);
            });
        });

        describe('updateEdges()', () => {
            it('should update multiple edges in bulk', () => {
                const updates = [
                    { id: 'edge1', weight: 10, label: 'Bulk Updated 1' },
                    { id: 'edge2', weight: 20, line_type: 'dashed' as const }
                ];

                const updatedIds = graph.updateEdges(updates);
                expect(updatedIds).toEqual(['edge1', 'edge2']);

                const edge1 = graph.getEdge('edge1');
                const edge2 = graph.getEdge('edge2');
                expect(edge1?.weight).toBe(10);
                expect(edge2?.line_type).toBe('dashed');
            });

            it('should validate all edge updates', () => {
                const invalidUpdates = [
                    { id: 'edge1', weight: 5 }, // Valid
                    { id: 'edge2', weight: -1 }, // Invalid weight
                    { id: 'nonexistent', label: 'Invalid' }
                ];

                expect(() => {
                    graph.updateEdges(invalidUpdates);
                }).toThrow();
            });
        });
    });

    describe('Phase 4: Data Manipulation', () => {
        describe('Enhanced setData()', () => {
            it('should set data with position preservation', () => {
                // Set initial data and modify positions
                graph.setData(sampleGraphData);
                const node1 = graph.getNodeInstance('node1');
                if (node1) {
                    node1.position.x = 100;
                    node1.position.y = 200;
                }

                // Set new data preserving positions
                const newData = {
                    nodes: [{ id: 'node1', name: 'Updated Node 1' }],
                    links: []
                };

                graph.setData(newData, { preservePositions: true });

                const updatedNode = graph.getNodeInstance('node1');
                expect(updatedNode?.position.x).toBe(100);
                expect(updatedNode?.position.y).toBe(200);
            });

            it('should handle data replacement options', () => {
                const newData = {
                    nodes: [{ id: 'new1', name: 'New Node' }],
                    links: []
                };

                graph.setData(newData, {
                    layout: 'reset',
                    skipValidation: false
                });

                expect(graph.hasNode('new1')).toBe(true);
                expect(graph.hasNode('node1')).toBe(false); // Old data cleared
            });
        });

        describe('mergeData()', () => {
            beforeEach(() => {
                graph.clearData();
                graph.setData({
                    nodes: JSON.parse(JSON.stringify(sampleNodes)),
                    links: JSON.parse(JSON.stringify(sampleEdges))
                });
            });

            it('should merge new data with conflict resolution', () => {
                const mergeData = {
                    nodes: [
                        { id: 'node1', name: 'Updated Node 1' }, // Conflict
                        { id: 'node4', name: 'New Node 4' } // New
                    ],
                    links: [
                        { source: 'node1', target: 'node4', label: 'New Connection' }
                    ]
                };

                graph.mergeData(mergeData, {
                    nodeConflictResolution: 'update',
                    edgeConflictResolution: 'update'
                });

                expect(graph.getNode('node1')?.name).toBe('Updated Node 1');
                expect(graph.hasNode('node4')).toBe(true);
                expect(graph.getNodes()).toHaveLength(4); // 3 original + 1 new
            });

            it('should handle conflict preservation', () => {
                const mergeData = {
                    nodes: [{ id: 'node1', name: 'Should Be Ignored' }],
                    links: []
                };

                graph.mergeData(mergeData, {
                    nodeConflictResolution: 'preserve'
                });

                expect(graph.getNode('node1')?.name).toBe('Node 1'); // Original preserved
            });

            it('should handle conflict errors', () => {
                const mergeData = {
                    nodes: [{ id: 'node1', name: 'Conflict' }],
                    links: []
                };

                expect(() => {
                    graph.mergeData(mergeData, {
                        nodeConflictResolution: 'error'
                    });
                }).toThrow(NodeExistsError);
            });
        });

        describe('clearData()', () => {
            it('should clear all graph data', () => {
                graph.setData(sampleGraphData);
                expect(graph.getNodes()).toHaveLength(3);

                graph.clearData();

                expect(graph.getNodes()).toHaveLength(0);
                expect(graph.getLinks()).toHaveLength(0);
            });

            it('should handle clear options', () => {
                graph.setData(sampleGraphData);
                
                graph.clearData({ animate: true, duration: 500 });

                expect(graph.getNodes()).toHaveLength(0);
            });
        });
    });

    describe('Phase 4: Transaction Support', () => {
        beforeEach(() => {
            graph.clearData();
            graph.setData({
                nodes: JSON.parse(JSON.stringify(sampleNodes)),
                links: JSON.parse(JSON.stringify(sampleEdges))
            });
        });

        describe('Transaction Lifecycle', () => {
            it('should start, commit, and rollback transactions', () => {
                const txId = graph.startTransaction();
                expect(typeof txId).toBe('string');
                expect(graph.isInTransaction()).toBe(true);

                // Make changes
                graph.addNode({ id: 'tx-node', name: 'Transaction Node' });
                graph.updateNode('node1', { name: 'Transaction Update' });

                // Check changes are applied
                expect(graph.hasNode('tx-node')).toBe(true);
                expect(graph.getNode('node1')?.name).toBe('Transaction Update');

                // Commit transaction
                const summary = graph.commitTransaction();
                expect(summary.id).toBe(txId);
                expect(summary.operationCount).toBeGreaterThan(0);
                expect(graph.isInTransaction()).toBe(false);

                // Changes should persist
                expect(graph.hasNode('tx-node')).toBe(true);
            });

            it('should rollback transaction changes', () => {
                const originalName = graph.getNode('node1')?.name;
                
                graph.startTransaction();
                
                // Make changes
                graph.addNode({ id: 'rollback-node', name: 'Rollback Node' });
                graph.updateNode('node1', { name: 'Rollback Update' });
                graph.deleteNode('node2');

                // Verify changes are applied
                expect(graph.hasNode('rollback-node')).toBe(true);
                expect(graph.hasNode('node2')).toBe(false);

                // Rollback
                const summary = graph.rollbackTransaction();
                expect(summary.operationCount).toBeGreaterThan(0);

                // Verify rollback
                expect(graph.hasNode('rollback-node')).toBe(false);
                expect(graph.hasNode('node2')).toBe(true);
                expect(graph.getNode('node1')?.name).toBe(originalName);
            });
        });

        describe('Transaction State Management', () => {
            it('should prevent nested transactions', () => {
                graph.startTransaction();
                
                expect(() => {
                    graph.startTransaction();
                }).toThrow('Transaction already in progress');
            });

            it('should throw error when committing without transaction', () => {
                expect(() => {
                    graph.commitTransaction();
                }).toThrow('No transaction in progress');
            });

            it('should throw error when rolling back without transaction', () => {
                expect(() => {
                    graph.rollbackTransaction();
                }).toThrow('No transaction in progress');
            });

            it('should provide transaction status', () => {
                expect(graph.getTransactionStatus()).toBeNull();

                const txId = graph.startTransaction();
                const status = graph.getTransactionStatus();
                
                expect(status).toBeDefined();
                expect(status?.id).toBe(txId);
                expect(status?.operationCount).toBe(0);
            });
        });

        describe('Transaction Operation Tracking', () => {
            it('should track operations during transaction', () => {
                graph.startTransaction();

                graph.addNode({ id: 'tracked1', name: 'Tracked Node 1' });
                graph.addNode({ id: 'tracked2', name: 'Tracked Node 2' });
                graph.updateNode('node1', { name: 'Tracked Update' });

                const status = graph.getTransactionStatus();
                expect(status?.operationCount).toBeGreaterThan(0);

                graph.commitTransaction();
            });

            it('should handle bulk operations in transactions', () => {
                graph.startTransaction();

                graph.updateNodes([
                    { id: 'node1', name: 'Bulk in Transaction 1' },
                    { id: 'node2', name: 'Bulk in Transaction 2' }
                ]);

                const status = graph.getTransactionStatus();
                expect(status?.operationCount).toBeGreaterThan(0);

                graph.rollbackTransaction();

                // Verify rollback of bulk operation
                expect(graph.getNode('node1')?.name).toBe('Node 1');
                expect(graph.getNode('node2')?.name).toBe('Node 2');
            });
        });
    });

    describe('Error Handling and Edge Cases', () => {
        describe('Validation Edge Cases', () => {
            it('should handle malformed data gracefully', () => {
                expect(() => {
                    graph.addNode(null as any);
                }).toThrow(NodeValidationError);

                expect(() => {
                    graph.addNode(undefined as any);
                }).toThrow(NodeValidationError);
            });

            it('should handle empty strings and whitespace', () => {
                expect(() => {
                    graph.addNode({ id: '   ', name: 'Whitespace ID' });
                }).toThrow(NodeValidationError);

                expect(() => {
                    graph.addNode({ id: 'valid', name: '   ' });
                }).toThrow(NodeValidationError);
            });

            it('should validate numeric properties thoroughly', () => {
                expect(() => {
                    graph.addNode({ id: 'test', name: 'Test', size: NaN });
                }).toThrow(NodeValidationError);

                expect(() => {
                    graph.addNode({ id: 'test', name: 'Test', size: Infinity });
                }).toThrow(NodeValidationError);
            });
        });

        describe('Performance and Scalability', () => {
            it('should handle bulk operations efficiently', () => {
                // Add a reasonable number of nodes
                const bulkNodes = Array.from({ length: 100 }, (_, i) => ({
                    id: `bulk-node-${i}`,
                    name: `Bulk Node ${i}`,
                    type: 'bulk'
                }));

                bulkNodes.forEach(node => graph.addNode(node));
                expect(graph.getNodes()).toHaveLength(100);

                // Bulk update all nodes
                const updates = bulkNodes.map(node => ({
                    id: node.id,
                    name: `Updated ${node.name}`
                }));

                const start = performance.now();
                const updatedIds = graph.updateNodes(updates);
                const duration = performance.now() - start;

                expect(updatedIds).toHaveLength(100);
                expect(duration).toBeLessThan(1000); // Should complete within 1 second
            });
        });
    });
});