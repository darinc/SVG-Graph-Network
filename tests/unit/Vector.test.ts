import { Vector } from '../../src/Vector.js';

describe('Vector', () => {
    describe('constructor', () => {
        test('should create vector with given coordinates', () => {
            const vector = new Vector(10, 20);
            expect(vector.x).toBe(10);
            expect(vector.y).toBe(20);
        });

        test('should create vector with default coordinates (0, 0)', () => {
            const vector = new Vector();
            expect(vector.x).toBe(0);
            expect(vector.y).toBe(0);
        });

        test('should handle negative coordinates', () => {
            const vector = new Vector(-5, -10);
            expect(vector.x).toBe(-5);
            expect(vector.y).toBe(-10);
        });

        test('should handle floating point coordinates', () => {
            const vector = new Vector(3.14, 2.71);
            expect(vector.x).toBeCloseTo(3.14);
            expect(vector.y).toBeCloseTo(2.71);
        });
    });

    describe('add', () => {
        test('should add two vectors correctly', () => {
            const v1 = new Vector(10, 20);
            const v2 = new Vector(5, 15);
            const result = v1.add(v2);
            
            expect(result.x).toBe(15);
            expect(result.y).toBe(35);
        });

        test('should handle negative addition', () => {
            const v1 = new Vector(10, 20);
            const v2 = new Vector(-5, -15);
            const result = v1.add(v2);
            
            expect(result.x).toBe(5);
            expect(result.y).toBe(5);
        });

        test('should not modify original vector', () => {
            const v1 = new Vector(10, 20);
            const v2 = new Vector(5, 15);
            const result = v1.add(v2);
            
            expect(v1.x).toBe(10);
            expect(v1.y).toBe(20);
            expect(result).not.toBe(v1);
        });

        test('should handle zero vector addition', () => {
            const v1 = new Vector(10, 20);
            const v2 = new Vector(0, 0);
            const result = v1.add(v2);
            
            expect(result.x).toBe(10);
            expect(result.y).toBe(20);
        });
    });

    describe('subtract', () => {
        test('should subtract two vectors correctly', () => {
            const v1 = new Vector(10, 20);
            const v2 = new Vector(5, 15);
            const result = v1.subtract(v2);
            
            expect(result.x).toBe(5);
            expect(result.y).toBe(5);
        });

        test('should handle negative subtraction', () => {
            const v1 = new Vector(10, 20);
            const v2 = new Vector(-5, -15);
            const result = v1.subtract(v2);
            
            expect(result.x).toBe(15);
            expect(result.y).toBe(35);
        });

        test('should not modify original vector', () => {
            const v1 = new Vector(10, 20);
            const v2 = new Vector(5, 15);
            const result = v1.subtract(v2);
            
            expect(v1.x).toBe(10);
            expect(v1.y).toBe(20);
            expect(result).not.toBe(v1);
        });

        test('should return zero vector when subtracting identical vectors', () => {
            const v1 = new Vector(10, 20);
            const v2 = new Vector(10, 20);
            const result = v1.subtract(v2);
            
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
        });
    });

    describe('multiply', () => {
        test('should multiply vector by scalar correctly', () => {
            const vector = new Vector(10, 20);
            const result = vector.multiply(2);
            
            expect(result.x).toBe(20);
            expect(result.y).toBe(40);
        });

        test('should handle negative scalar multiplication', () => {
            const vector = new Vector(10, 20);
            const result = vector.multiply(-2);
            
            expect(result.x).toBe(-20);
            expect(result.y).toBe(-40);
        });

        test('should handle zero scalar multiplication', () => {
            const vector = new Vector(10, 20);
            const result = vector.multiply(0);
            
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
        });

        test('should handle fractional scalar multiplication', () => {
            const vector = new Vector(10, 20);
            const result = vector.multiply(0.5);
            
            expect(result.x).toBe(5);
            expect(result.y).toBe(10);
        });

        test('should not modify original vector', () => {
            const vector = new Vector(10, 20);
            const result = vector.multiply(2);
            
            expect(vector.x).toBe(10);
            expect(vector.y).toBe(20);
            expect(result).not.toBe(vector);
        });
    });

    describe('divide', () => {
        test('should divide vector by scalar correctly', () => {
            const vector = new Vector(10, 20);
            const result = vector.divide(2);
            
            expect(result.x).toBe(5);
            expect(result.y).toBe(10);
        });

        test('should handle negative scalar division', () => {
            const vector = new Vector(10, 20);
            const result = vector.divide(-2);
            
            expect(result.x).toBe(-5);
            expect(result.y).toBe(-10);
        });

        test('should handle fractional scalar division', () => {
            const vector = new Vector(10, 20);
            const result = vector.divide(0.5);
            
            expect(result.x).toBe(20);
            expect(result.y).toBe(40);
        });

        test('should throw error when dividing by zero', () => {
            const vector = new Vector(10, 20);
            
            expect(() => {
                vector.divide(0);
            }).toThrow('Division by zero');
        });

        test('should not modify original vector', () => {
            const vector = new Vector(10, 20);
            const result = vector.divide(2);
            
            expect(vector.x).toBe(10);
            expect(vector.y).toBe(20);
            expect(result).not.toBe(vector);
        });
    });

    describe('magnitude', () => {
        test('should calculate magnitude correctly for positive coordinates', () => {
            const vector = new Vector(3, 4);
            expect(vector.magnitude()).toBe(5);
        });

        test('should calculate magnitude correctly for negative coordinates', () => {
            const vector = new Vector(-3, -4);
            expect(vector.magnitude()).toBe(5);
        });

        test('should return zero for zero vector', () => {
            const vector = new Vector(0, 0);
            expect(vector.magnitude()).toBe(0);
        });

        test('should handle floating point coordinates', () => {
            const vector = new Vector(1, 1);
            expect(vector.magnitude()).toBeCloseTo(Math.sqrt(2));
        });

        test('should calculate magnitude for unit vectors', () => {
            const vector1 = new Vector(1, 0);
            const vector2 = new Vector(0, 1);
            
            expect(vector1.magnitude()).toBe(1);
            expect(vector2.magnitude()).toBe(1);
        });
    });

    describe('normalize', () => {
        test('should normalize vector to unit length', () => {
            const vector = new Vector(3, 4);
            const normalized = vector.normalize();
            
            expect(normalized.magnitude()).toBeCloseTo(1);
            expect(normalized.x).toBeCloseTo(0.6);
            expect(normalized.y).toBeCloseTo(0.8);
        });

        test('should handle negative coordinates', () => {
            const vector = new Vector(-3, -4);
            const normalized = vector.normalize();
            
            expect(normalized.magnitude()).toBeCloseTo(1);
            expect(normalized.x).toBeCloseTo(-0.6);
            expect(normalized.y).toBeCloseTo(-0.8);
        });

        test('should throw error for zero vector', () => {
            const vector = new Vector(0, 0);
            
            expect(() => {
                vector.normalize();
            }).toThrow('Cannot normalize zero vector');
        });

        test('should not modify original vector', () => {
            const vector = new Vector(3, 4);
            const normalized = vector.normalize();
            
            expect(vector.x).toBe(3);
            expect(vector.y).toBe(4);
            expect(normalized).not.toBe(vector);
        });

        test('should handle already normalized vector', () => {
            const vector = new Vector(1, 0);
            const normalized = vector.normalize();
            
            expect(normalized.magnitude()).toBeCloseTo(1);
            expect(normalized.x).toBeCloseTo(1);
            expect(normalized.y).toBeCloseTo(0);
        });
    });

    describe('distance', () => {
        test('should calculate distance between two vectors correctly', () => {
            const v1 = new Vector(0, 0);
            const v2 = new Vector(3, 4);
            
            expect(Vector.distance(v1, v2)).toBe(5);
        });

        test('should handle negative coordinates', () => {
            const v1 = new Vector(-1, -1);
            const v2 = new Vector(2, 3);
            
            expect(Vector.distance(v1, v2)).toBe(5);
        });

        test('should return zero for identical vectors', () => {
            const v1 = new Vector(10, 20);
            const v2 = new Vector(10, 20);
            
            expect(Vector.distance(v1, v2)).toBe(0);
        });

        test('should be symmetric', () => {
            const v1 = new Vector(1, 2);
            const v2 = new Vector(4, 6);
            
            expect(Vector.distance(v1, v2)).toBe(Vector.distance(v2, v1));
        });

        test('should handle floating point coordinates', () => {
            const v1 = new Vector(0.5, 0.5);
            const v2 = new Vector(1.5, 1.5);
            
            expect(Vector.distance(v1, v2)).toBeCloseTo(Math.sqrt(2));
        });
    });

    describe('edge cases', () => {
        test('should handle very large numbers', () => {
            const vector = new Vector(1e10, 1e10);
            expect(vector.magnitude()).toBeCloseTo(Math.sqrt(2e20));
        });

        test('should handle very small numbers', () => {
            const vector = new Vector(1e-10, 1e-10);
            expect(vector.magnitude()).toBeCloseTo(Math.sqrt(2e-20));
        });

        test('should handle infinity', () => {
            const vector = new Vector(Infinity, 0);
            expect(vector.magnitude()).toBe(Infinity);
        });

        test('should handle NaN', () => {
            const vector = new Vector(NaN, 0);
            expect(vector.magnitude()).toBeNaN();
        });
    });
});