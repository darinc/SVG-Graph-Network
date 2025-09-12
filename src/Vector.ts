/**
 * Simple Vector class for physics calculations with full TypeScript support
 */
export class Vector {
    /**
     * Create a new Vector with x and y components
     * @param x - X component (default: 0)
     * @param y - Y component (default: 0)
     */
    constructor(
        public x: number = 0,
        public y: number = 0
    ) {}

    /**
     * Add another vector to this vector
     * @param v - Vector to add
     * @returns New vector representing the sum
     */
    add(v: Vector): Vector {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    /**
     * Subtract another vector from this vector
     * @param v - Vector to subtract
     * @returns New vector representing the difference
     */
    subtract(v: Vector): Vector {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    /**
     * Multiply this vector by a scalar
     * @param s - Scalar value to multiply by
     * @returns New vector representing the scaled vector
     */
    multiply(s: number): Vector {
        return new Vector(this.x * s, this.y * s);
    }

    /**
     * Divide this vector by a scalar
     * @param s - Scalar value to divide by
     * @returns New vector representing the divided vector
     * @throws Error if dividing by zero
     */
    divide(s: number): Vector {
        if (s === 0) {
            throw new Error('Division by zero');
        }
        return new Vector(this.x / s, this.y / s);
    }

    /**
     * Calculate the magnitude (length) of this vector
     * @returns The magnitude of the vector
     */
    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Normalize this vector to unit length
     * @returns New vector with magnitude 1 in the same direction
     * @throws Error if attempting to normalize a zero vector
     */
    normalize(): Vector {
        const mag = this.magnitude();
        if (mag === 0) {
            throw new Error('Cannot normalize zero vector');
        }
        return new Vector(this.x / mag, this.y / mag);
    }

    /**
     * Calculate the distance between two vectors
     * @param v1 - First vector
     * @param v2 - Second vector
     * @returns Distance between the vectors
     */
    static distance(v1: Vector, v2: Vector): number {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Create a zero vector (0, 0)
     * @returns New zero vector
     */
    static zero(): Vector {
        return new Vector(0, 0);
    }

    /**
     * Create a unit vector in the X direction (1, 0)
     * @returns New unit X vector
     */
    static unitX(): Vector {
        return new Vector(1, 0);
    }

    /**
     * Create a unit vector in the Y direction (0, 1)
     * @returns New unit Y vector
     */
    static unitY(): Vector {
        return new Vector(0, 1);
    }

    /**
     * Create a vector from polar coordinates
     * @param magnitude - Length of the vector
     * @param angle - Angle in radians
     * @returns New vector from polar coordinates
     */
    static fromPolar(magnitude: number, angle: number): Vector {
        return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
    }

    /**
     * Calculate the angle of this vector in radians
     * @returns Angle in radians (from -π to π)
     */
    angle(): number {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Calculate the dot product with another vector
     * @param v - Other vector
     * @returns Dot product result
     */
    dot(v: Vector): number {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * Calculate the cross product magnitude with another vector (2D cross product)
     * @param v - Other vector
     * @returns Cross product magnitude (scalar in 2D)
     */
    cross(v: Vector): number {
        return this.x * v.y - this.y * v.x;
    }

    /**
     * Create a copy of this vector
     * @returns New vector with same components
     */
    clone(): Vector {
        return new Vector(this.x, this.y);
    }

    /**
     * Check if this vector equals another vector (within tolerance)
     * @param v - Other vector
     * @param tolerance - Tolerance for comparison (default: 1e-10)
     * @returns True if vectors are equal within tolerance
     */
    equals(v: Vector, tolerance: number = 1e-10): boolean {
        return Math.abs(this.x - v.x) < tolerance && Math.abs(this.y - v.y) < tolerance;
    }

    /**
     * Convert vector to string representation
     * @returns String representation of the vector
     */
    toString(): string {
        return `Vector(${this.x.toFixed(3)}, ${this.y.toFixed(3)})`;
    }

    /**
     * Convert vector to array [x, y]
     * @returns Array representation of the vector
     */
    toArray(): [number, number] {
        return [this.x, this.y];
    }

    /**
     * Convert vector to object {x, y}
     * @returns Object representation of the vector
     */
    toObject(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }
}
