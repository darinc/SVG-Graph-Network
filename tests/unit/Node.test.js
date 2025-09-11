import { Node } from '../../src/Node.js';
import { Vector } from '../../src/Vector.js';
import { createMockNode } from '../utils/testHelpers.js';

describe('Node', () => {
    describe('constructor', () => {
        test('should create node with required data', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            expect(node.data).toBe(data);
            expect(node.position).toBeInstanceOf(Vector);
            expect(node.velocity).toBeInstanceOf(Vector);
            expect(node.force).toBeInstanceOf(Vector);
            expect(node.size).toBe(20);
            expect(node.isFixed).toBe(false);
        });

        test('should create node with custom container dimensions', () => {
            const data = createMockNode();
            const node = new Node(data, 1200, 800);
            
            expect(node.position.x).toBeGreaterThanOrEqual(0);
            expect(node.position.x).toBeLessThanOrEqual(1200);
            expect(node.position.y).toBeGreaterThanOrEqual(0);
            expect(node.position.y).toBeLessThanOrEqual(800);
        });

        test('should use default container dimensions', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            expect(node.position.x).toBeGreaterThanOrEqual(0);
            expect(node.position.x).toBeLessThanOrEqual(800);
            expect(node.position.y).toBeGreaterThanOrEqual(0);
            expect(node.position.y).toBeLessThanOrEqual(600);
        });

        test('should use custom size from data', () => {
            const data = createMockNode({ size: 50 });
            const node = new Node(data);
            
            expect(node.size).toBe(50);
        });

        test('should use default size when not provided', () => {
            const data = createMockNode();
            delete data.size;
            const node = new Node(data);
            
            expect(node.size).toBe(20);
        });

        test('should initialize velocity and force as zero vectors', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            expect(node.velocity.x).toBe(0);
            expect(node.velocity.y).toBe(0);
            expect(node.force.x).toBe(0);
            expect(node.force.y).toBe(0);
        });

        test('should initialize dynamic dimensions as null', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            expect(node.dynamicWidth).toBeNull();
            expect(node.dynamicHeight).toBeNull();
        });
    });

    describe('resetPosition', () => {
        test('should reset position to random location within bounds', () => {
            const data = createMockNode();
            const node = new Node(data, 400, 300);
            const originalPosition = { x: node.position.x, y: node.position.y };
            
            node.resetPosition(1000, 800);
            
            expect(node.position.x).toBeGreaterThanOrEqual(0);
            expect(node.position.x).toBeLessThanOrEqual(1000);
            expect(node.position.y).toBeGreaterThanOrEqual(0);
            expect(node.position.y).toBeLessThanOrEqual(800);
            
            // Position should likely be different (though there's a tiny chance it could be the same)
            expect(node.position.x !== originalPosition.x || node.position.y !== originalPosition.y).toBe(true);
        });

        test('should reset velocity to zero when resetting position', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            // Set some velocity
            node.velocity.x = 10;
            node.velocity.y = 20;
            
            node.resetPosition(800, 600);
            
            expect(node.velocity.x).toBe(0);
            expect(node.velocity.y).toBe(0);
        });

        test('should not reset position if node is fixed', () => {
            const data = createMockNode();
            const node = new Node(data);
            const originalPosition = { x: node.position.x, y: node.position.y };
            
            node.fix();
            node.resetPosition(1000, 800);
            
            expect(node.position.x).toBe(originalPosition.x);
            expect(node.position.y).toBe(originalPosition.y);
        });

        test('should still reset velocity to zero even if node is fixed', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            // Set some velocity and fix the node
            node.velocity.x = 10;
            node.velocity.y = 20;
            node.fix();
            
            node.resetPosition(800, 600);
            
            expect(node.velocity.x).toBe(0);
            expect(node.velocity.y).toBe(0);
        });
    });

    describe('fix', () => {
        test('should fix node at current position', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            expect(node.isFixed).toBe(false);
            
            node.fix();
            
            expect(node.isFixed).toBe(true);
        });

        test('should reset velocity when fixing node', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            // Set some velocity
            node.velocity.x = 10;
            node.velocity.y = 20;
            
            node.fix();
            
            expect(node.velocity.x).toBe(0);
            expect(node.velocity.y).toBe(0);
        });

        test('should be idempotent (calling multiple times has same effect)', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            node.fix();
            expect(node.isFixed).toBe(true);
            
            node.fix();
            expect(node.isFixed).toBe(true);
        });
    });

    describe('unfix', () => {
        test('should unfix previously fixed node', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            node.fix();
            expect(node.isFixed).toBe(true);
            
            node.unfix();
            expect(node.isFixed).toBe(false);
        });

        test('should be idempotent (calling multiple times has same effect)', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            node.unfix();
            expect(node.isFixed).toBe(false);
            
            node.unfix();
            expect(node.isFixed).toBe(false);
        });

        test('should not affect velocity when unfixing', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            // Set some velocity, fix, then unfix
            node.velocity.x = 10;
            node.velocity.y = 20;
            node.fix(); // This resets velocity to 0
            node.velocity.x = 5; // Set new velocity
            node.velocity.y = 15;
            
            node.unfix();
            
            expect(node.velocity.x).toBe(5);
            expect(node.velocity.y).toBe(15);
        });
    });

    describe('data integrity', () => {
        test('should maintain reference to original data object', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            expect(node.data).toBe(data);
            
            // Modifying the original data should be reflected in the node
            data.name = 'Modified Name';
            expect(node.data.name).toBe('Modified Name');
        });

        test('should handle various node shapes', () => {
            const shapes = ['circle', 'rectangle', 'square', 'triangle'];
            
            shapes.forEach(shape => {
                const data = createMockNode({ shape });
                const node = new Node(data);
                
                expect(node.data.shape).toBe(shape);
            });
        });

        test('should handle various node types', () => {
            const types = ['primary', 'secondary', 'tertiary', 'auxiliary'];
            
            types.forEach(type => {
                const data = createMockNode({ type });
                const node = new Node(data);
                
                expect(node.data.type).toBe(type);
            });
        });
    });

    describe('vector properties', () => {
        test('should have independent vector instances', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            expect(node.position).not.toBe(node.velocity);
            expect(node.position).not.toBe(node.force);
            expect(node.velocity).not.toBe(node.force);
        });

        test('should allow modification of vector properties', () => {
            const data = createMockNode();
            const node = new Node(data);
            
            node.position.x = 100;
            node.position.y = 200;
            node.velocity.x = 5;
            node.velocity.y = 10;
            node.force.x = 0.1;
            node.force.y = 0.2;
            
            expect(node.position.x).toBe(100);
            expect(node.position.y).toBe(200);
            expect(node.velocity.x).toBe(5);
            expect(node.velocity.y).toBe(10);
            expect(node.force.x).toBe(0.1);
            expect(node.force.y).toBe(0.2);
        });
    });

    describe('edge cases', () => {
        test('should handle zero container dimensions', () => {
            const data = createMockNode();
            const node = new Node(data, 0, 0);
            
            expect(node.position.x).toBe(0);
            expect(node.position.y).toBe(0);
        });

        test('should handle very large container dimensions', () => {
            const data = createMockNode();
            const node = new Node(data, 1e6, 1e6);
            
            expect(node.position.x).toBeGreaterThanOrEqual(0);
            expect(node.position.x).toBeLessThanOrEqual(1e6);
            expect(node.position.y).toBeGreaterThanOrEqual(0);
            expect(node.position.y).toBeLessThanOrEqual(1e6);
        });

        test('should handle zero size', () => {
            const data = createMockNode({ size: 0 });
            const node = new Node(data);
            
            expect(node.size).toBe(0);
        });

        test('should handle negative size', () => {
            const data = createMockNode({ size: -10 });
            const node = new Node(data);
            
            expect(node.size).toBe(-10);
        });

        test('should handle fractional size', () => {
            const data = createMockNode({ size: 15.5 });
            const node = new Node(data);
            
            expect(node.size).toBe(15.5);
        });
    });
});