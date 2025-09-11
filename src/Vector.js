/**
 * Simple Vector class for physics calculations
 */
export class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    multiply(s) {
        return new Vector(this.x * s, this.y * s);
    }

    divide(s) {
        if (s === 0) {
            throw new Error('Division by zero');
        }
        return new Vector(this.x / s, this.y / s);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) {
            throw new Error('Cannot normalize zero vector');
        }
        return new Vector(this.x / mag, this.y / mag);
    }

    static distance(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}