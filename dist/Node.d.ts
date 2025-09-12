import { Vector } from './Vector';
import { NodeData } from './types/index';
/**
 * Node class representing a graph node with position, velocity, and force vectors
 * Enhanced with full TypeScript support and generic node data
 */
export declare class Node<T extends NodeData = NodeData> {
    readonly data: T;
    /** Position vector of the node */
    position: Vector;
    /** Velocity vector for physics simulation */
    velocity: Vector;
    /** Force vector accumulator for physics simulation */
    force: Vector;
    /** Visual size of the node in pixels */
    size: number;
    /** Whether the node is fixed in position */
    isFixed: boolean;
    /** Dynamic width for rectangular nodes (calculated by renderer) */
    dynamicWidth: number | null;
    /** Dynamic height for rectangular nodes (calculated by renderer) */
    dynamicHeight: number | null;
    /**
     * Create a new Node instance
     * @param data - Node data containing id, name, and other properties
     * @param containerWidth - Container width for random positioning (default: 800)
     * @param containerHeight - Container height for random positioning (default: 600)
     */
    constructor(data: T, containerWidth?: number, containerHeight?: number);
    /**
     * Reset the node's position to a random location within the specified bounds
     * This also resets velocity to zero but preserves the fixed state for position
     * @param containerWidth - New container width
     * @param containerHeight - New container height
     */
    resetPosition(containerWidth: number, containerHeight: number): void;
    /**
     * Fix the node at its current position and reset velocity
     * Fixed nodes will not be affected by physics forces
     */
    fix(): void;
    /**
     * Unfix the node, allowing it to move freely with physics
     */
    unfix(): void;
    /**
     * Get the display name of the node
     * @returns The node's display name
     */
    getName(): string;
    /**
     * Get the unique identifier of the node
     * @returns The node's unique ID
     */
    getId(): string;
    /**
     * Get the type of the node for styling and grouping
     * @returns The node's type or undefined if not specified
     */
    getType(): string | undefined;
    /**
     * Get the shape of the node for rendering
     * @returns The node's shape or 'circle' as default
     */
    getShape(): 'circle' | 'rectangle' | 'square' | 'triangle';
    /**
     * Check if this node has the same type as another node
     * @param other - Other node to compare with
     * @returns True if both nodes have the same type
     */
    hasSameType(other: Node): boolean;
    /**
     * Calculate the distance to another node
     * @param other - Other node
     * @returns Distance between nodes
     */
    distanceTo(other: Node): number;
    /**
     * Calculate the direction vector to another node
     * @param other - Other node
     * @returns Normalized direction vector pointing towards the other node
     */
    directionTo(other: Node): Vector;
    /**
     * Apply a force to this node (accumulates with existing force)
     * @param force - Force vector to apply
     */
    applyForce(force: Vector): void;
    /**
     * Reset the accumulated force to zero
     */
    resetForce(): void;
    /**
     * Update the node's position based on current velocity and force
     * This is typically called by the physics engine
     * @param deltaTime - Time step for integration (default: 1)
     * @param damping - Velocity damping factor (default: 0.95)
     */
    updatePosition(deltaTime?: number, damping?: number): void;
    /**
     * Get the effective radius for collision detection
     * Takes into account different shapes and dynamic sizing
     * @returns Effective radius for physics calculations
     */
    getEffectiveRadius(): number;
    /**
     * Clone this node with the same data but reset physics state
     * @param containerWidth - Container width for new position
     * @param containerHeight - Container height for new position
     * @returns New node instance with cloned data
     */
    clone(containerWidth?: number, containerHeight?: number): Node<T>;
    /**
     * Convert node to a serializable object
     * @returns Object representation including data and current state
     */
    toObject(): {
        data: T;
        position: {
            x: number;
            y: number;
        };
        velocity: {
            x: number;
            y: number;
        };
        isFixed: boolean;
        size: number;
    };
    /**
     * Create a string representation of the node
     * @returns String representation
     */
    toString(): string;
    /**
     * Create a node from a serialized object
     * @param obj - Serialized node object
     * @param containerWidth - Container width (if position should be reset)
     * @param containerHeight - Container height (if position should be reset)
     * @returns New node instance
     */
    static fromObject<T extends NodeData>(obj: {
        data: T;
        position?: {
            x: number;
            y: number;
        };
        velocity?: {
            x: number;
            y: number;
        };
        isFixed?: boolean;
        size?: number;
    }, containerWidth?: number, containerHeight?: number): Node<T>;
}
//# sourceMappingURL=Node.d.ts.map