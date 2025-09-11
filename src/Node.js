import { Vector } from './Vector.js';

/**
 * Node class representing a graph node with position, velocity, and force vectors
 */
export class Node {
    constructor(data, containerWidth = 800, containerHeight = 600) {
        this.data = data;
        this.position = new Vector(
            Math.random() * containerWidth, 
            Math.random() * containerHeight
        );
        this.velocity = new Vector();
        this.force = new Vector();
        this.size = data.size || 20;
        this.isFixed = false;
        
        // Dynamic dimensions for rectangles (calculated later)
        this.dynamicWidth = null;
        this.dynamicHeight = null;
    }

    /**
     * Reset the node's position to a random location
     */
    resetPosition(containerWidth, containerHeight) {
        if (!this.isFixed) {
            this.position = new Vector(
                Math.random() * containerWidth,
                Math.random() * containerHeight
            );
            this.velocity = new Vector();
        }
    }

    /**
     * Fix the node at its current position
     */
    fix() {
        this.isFixed = true;
        this.velocity = new Vector();
    }

    /**
     * Unfix the node, allowing it to move
     */
    unfix() {
        this.isFixed = false;
    }
}