import { Vector } from './Vector';
import { NodeData } from './types/index';

/**
 * Node class representing a graph node with position, velocity, and force vectors
 * Enhanced with full TypeScript support and generic node data
 */
export class Node<T extends NodeData = NodeData> {
    /** Position vector of the node */
    public position: Vector;

    /** Velocity vector for physics simulation */
    public velocity: Vector;

    /** Force vector accumulator for physics simulation */
    public force: Vector;

    /** Visual size of the node in pixels */
    public size: number;

    /** Whether the node is fixed in position */
    public isFixed: boolean;

    /** Dynamic width for rectangular nodes (calculated by renderer) */
    public dynamicWidth: number | null = null;

    /** Dynamic height for rectangular nodes (calculated by renderer) */
    public dynamicHeight: number | null = null;

    /**
     * Create a new Node instance
     * @param data - Node data containing id, name, and other properties
     * @param containerWidth - Container width for random positioning (default: 800)
     * @param containerHeight - Container height for random positioning (default: 600)
     */
    constructor(
        public readonly data: T,
        containerWidth: number = 800,
        containerHeight: number = 600
    ) {
        // Initialize position randomly within container bounds
        this.position = new Vector(Math.random() * containerWidth, Math.random() * containerHeight);

        // Initialize physics vectors to zero
        this.velocity = new Vector();
        this.force = new Vector();

        // Set size from data or use default
        this.size = data.size !== undefined ? data.size : 20;

        // Node starts unfixed
        this.isFixed = false;
    }

    /**
     * Reset the node's position to a random location within the specified bounds
     * This also resets velocity to zero but preserves the fixed state for position
     * @param containerWidth - New container width
     * @param containerHeight - New container height
     */
    resetPosition(containerWidth: number, containerHeight: number): void {
        // Always reset velocity
        this.velocity = new Vector();

        // Only reset position if node is not fixed
        if (!this.isFixed) {
            this.position = new Vector(
                Math.random() * containerWidth,
                Math.random() * containerHeight
            );
        }
    }

    /**
     * Fix the node at its current position and reset velocity
     * Fixed nodes will not be affected by physics forces
     */
    fix(): void {
        this.isFixed = true;
        this.velocity = new Vector();
    }

    /**
     * Unfix the node, allowing it to move freely with physics
     */
    unfix(): void {
        this.isFixed = false;
    }

    /**
     * Get the display name of the node
     * @returns The node's display name
     */
    getName(): string {
        return this.data.name;
    }

    /**
     * Get the unique identifier of the node
     * @returns The node's unique ID
     */
    getId(): string {
        return this.data.id;
    }

    /**
     * Get the type of the node for styling and grouping
     * @returns The node's type or undefined if not specified
     */
    getType(): string | undefined {
        return this.data.type;
    }

    /**
     * Get the shape of the node for rendering
     * @returns The node's shape or 'circle' as default
     */
    getShape(): 'circle' | 'rectangle' | 'square' | 'triangle' {
        return this.data.shape || 'circle';
    }

    /**
     * Check if this node has the same type as another node
     * @param other - Other node to compare with
     * @returns True if both nodes have the same type
     */
    hasSameType(other: Node): boolean {
        return (
            this.data.type !== undefined &&
            other.data.type !== undefined &&
            this.data.type === other.data.type
        );
    }

    /**
     * Calculate the distance to another node
     * @param other - Other node
     * @returns Distance between nodes
     */
    distanceTo(other: Node): number {
        return Vector.distance(this.position, other.position);
    }

    /**
     * Calculate the direction vector to another node
     * @param other - Other node
     * @returns Normalized direction vector pointing towards the other node
     */
    directionTo(other: Node): Vector {
        return other.position.subtract(this.position).normalize();
    }

    /**
     * Apply a force to this node (accumulates with existing force)
     * @param force - Force vector to apply
     */
    applyForce(force: Vector): void {
        this.force = this.force.add(force);
    }

    /**
     * Reset the accumulated force to zero
     */
    resetForce(): void {
        this.force = new Vector();
    }

    /**
     * Update the node's position based on current velocity and force
     * This is typically called by the physics engine
     * @param deltaTime - Time step for integration (default: 1)
     * @param damping - Velocity damping factor (default: 0.95)
     */
    updatePosition(deltaTime: number = 1, damping: number = 0.95): void {
        if (this.isFixed) return;

        // Integrate force into velocity (F = ma, assuming mass = 1)
        this.velocity = this.velocity.add(this.force.multiply(deltaTime));

        // Apply damping to velocity
        this.velocity = this.velocity.multiply(damping);

        // Integrate velocity into position
        this.position = this.position.add(this.velocity.multiply(deltaTime));
    }

    /**
     * Get the effective radius for collision detection
     * Takes into account different shapes and dynamic sizing
     * @returns Effective radius for physics calculations
     */
    getEffectiveRadius(): number {
        switch (this.getShape()) {
            case 'rectangle':
                // Use average of width and height if available, otherwise use size
                if (this.dynamicWidth && this.dynamicHeight) {
                    return Math.max(this.dynamicWidth, this.dynamicHeight) / 2;
                }
                return this.size * 1.4; // Rectangle default multiplier

            case 'square':
                return this.size * 1.4;

            case 'triangle':
                return this.size * 1.4;

            case 'circle':
            default:
                return this.size;
        }
    }

    /**
     * Clone this node with the same data but reset physics state
     * @param containerWidth - Container width for new position
     * @param containerHeight - Container height for new position
     * @returns New node instance with cloned data
     */
    clone(containerWidth?: number, containerHeight?: number): Node<T> {
        const cloned = new Node({ ...this.data } as T, containerWidth, containerHeight);

        // Preserve fixed state and position if specified
        if (containerWidth === undefined || containerHeight === undefined) {
            cloned.position = this.position.clone();
            cloned.isFixed = this.isFixed;
        }

        return cloned;
    }

    /**
     * Convert node to a serializable object
     * @returns Object representation including data and current state
     */
    toObject(): {
        data: T;
        position: { x: number; y: number };
        velocity: { x: number; y: number };
        isFixed: boolean;
        size: number;
    } {
        return {
            data: this.data,
            position: this.position.toObject(),
            velocity: this.velocity.toObject(),
            isFixed: this.isFixed,
            size: this.size
        };
    }

    /**
     * Create a string representation of the node
     * @returns String representation
     */
    toString(): string {
        return `Node(${this.data.id}: "${this.data.name}" at ${this.position.toString()})`;
    }

    /**
     * Create a node from a serialized object
     * @param obj - Serialized node object
     * @param containerWidth - Container width (if position should be reset)
     * @param containerHeight - Container height (if position should be reset)
     * @returns New node instance
     */
    static fromObject<T extends NodeData>(
        obj: {
            data: T;
            position?: { x: number; y: number };
            velocity?: { x: number; y: number };
            isFixed?: boolean;
            size?: number;
        },
        containerWidth?: number,
        containerHeight?: number
    ): Node<T> {
        const node = new Node(obj.data, containerWidth, containerHeight);

        // Restore state if provided
        if (obj.position) {
            node.position = new Vector(obj.position.x, obj.position.y);
        }
        if (obj.velocity) {
            node.velocity = new Vector(obj.velocity.x, obj.velocity.y);
        }
        if (obj.isFixed !== undefined) {
            node.isFixed = obj.isFixed;
        }
        if (obj.size !== undefined) {
            node.size = obj.size;
        }

        return node;
    }
}
