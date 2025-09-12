/**
 * Simple Vector class for physics calculations with full TypeScript support
 */
export declare class Vector {
    x: number;
    y: number;
    /**
     * Create a new Vector with x and y components
     * @param x - X component (default: 0)
     * @param y - Y component (default: 0)
     */
    constructor(x?: number, y?: number);
    /**
     * Add another vector to this vector
     * @param v - Vector to add
     * @returns New vector representing the sum
     */
    add(v: Vector): Vector;
    /**
     * Subtract another vector from this vector
     * @param v - Vector to subtract
     * @returns New vector representing the difference
     */
    subtract(v: Vector): Vector;
    /**
     * Multiply this vector by a scalar
     * @param s - Scalar value to multiply by
     * @returns New vector representing the scaled vector
     */
    multiply(s: number): Vector;
    /**
     * Divide this vector by a scalar
     * @param s - Scalar value to divide by
     * @returns New vector representing the divided vector
     * @throws Error if dividing by zero
     */
    divide(s: number): Vector;
    /**
     * Calculate the magnitude (length) of this vector
     * @returns The magnitude of the vector
     */
    magnitude(): number;
    /**
     * Normalize this vector to unit length
     * @returns New vector with magnitude 1 in the same direction
     * @throws Error if attempting to normalize a zero vector
     */
    normalize(): Vector;
    /**
     * Calculate the distance between two vectors
     * @param v1 - First vector
     * @param v2 - Second vector
     * @returns Distance between the vectors
     */
    static distance(v1: Vector, v2: Vector): number;
    /**
     * Create a zero vector (0, 0)
     * @returns New zero vector
     */
    static zero(): Vector;
    /**
     * Create a unit vector in the X direction (1, 0)
     * @returns New unit X vector
     */
    static unitX(): Vector;
    /**
     * Create a unit vector in the Y direction (0, 1)
     * @returns New unit Y vector
     */
    static unitY(): Vector;
    /**
     * Create a vector from polar coordinates
     * @param magnitude - Length of the vector
     * @param angle - Angle in radians
     * @returns New vector from polar coordinates
     */
    static fromPolar(magnitude: number, angle: number): Vector;
    /**
     * Calculate the angle of this vector in radians
     * @returns Angle in radians (from -π to π)
     */
    angle(): number;
    /**
     * Calculate the dot product with another vector
     * @param v - Other vector
     * @returns Dot product result
     */
    dot(v: Vector): number;
    /**
     * Calculate the cross product magnitude with another vector (2D cross product)
     * @param v - Other vector
     * @returns Cross product magnitude (scalar in 2D)
     */
    cross(v: Vector): number;
    /**
     * Create a copy of this vector
     * @returns New vector with same components
     */
    clone(): Vector;
    /**
     * Check if this vector equals another vector (within tolerance)
     * @param v - Other vector
     * @param tolerance - Tolerance for comparison (default: 1e-10)
     * @returns True if vectors are equal within tolerance
     */
    equals(v: Vector, tolerance?: number): boolean;
    /**
     * Convert vector to string representation
     * @returns String representation of the vector
     */
    toString(): string;
    /**
     * Convert vector to array [x, y]
     * @returns Array representation of the vector
     */
    toArray(): [number, number];
    /**
     * Convert vector to object {x, y}
     * @returns Object representation of the vector
     */
    toObject(): {
        x: number;
        y: number;
    };
}
//# sourceMappingURL=Vector.d.ts.map