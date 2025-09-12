/**
 * Custom error classes for graph data manipulation operations
 */
/**
 * Base class for all graph-related errors
 */
export declare abstract class GraphError extends Error {
    readonly code: string;
    readonly details?: Record<string, unknown>;
    constructor(message: string, code: string, details?: Record<string, unknown>);
}
/**
 * Thrown when node data validation fails
 */
export declare class NodeValidationError extends GraphError {
    constructor(message: string, nodeData?: unknown);
}
/**
 * Thrown when attempting to add a node that already exists
 */
export declare class NodeExistsError extends GraphError {
    constructor(nodeId: string);
}
/**
 * Thrown when attempting to operate on a non-existent node
 */
export declare class NodeNotFoundError extends GraphError {
    constructor(nodeId: string);
}
/**
 * Thrown when edge/link data validation fails
 */
export declare class EdgeValidationError extends GraphError {
    constructor(message: string, edgeData?: unknown);
}
/**
 * Thrown when attempting to add an edge that already exists
 */
export declare class EdgeExistsError extends GraphError {
    constructor(edgeId: string);
}
/**
 * Thrown when attempting to operate on a non-existent edge
 */
export declare class EdgeNotFoundError extends GraphError {
    constructor(edgeId: string);
}
/**
 * Thrown when attempting to create an edge with non-existent nodes
 */
export declare class InvalidEdgeReferencesError extends GraphError {
    constructor(sourceId: string, targetId: string, missingNodeIds: string[]);
}
/**
 * Thrown when data structure validation fails
 */
export declare class DataStructureError extends GraphError {
    constructor(message: string, data?: unknown);
}
/**
 * Utility functions for error handling
 */
export declare class GraphErrorUtils {
    /**
     * Check if an error is a graph-related error
     */
    static isGraphError(error: unknown): error is GraphError;
    /**
     * Extract error details for logging/debugging
     */
    static getErrorDetails(error: unknown): Record<string, unknown>;
    /**
     * Create a user-friendly error message
     */
    static getUserMessage(error: unknown): string;
}
//# sourceMappingURL=GraphErrors.d.ts.map