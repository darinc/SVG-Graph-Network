/**
 * Custom error classes for graph data manipulation operations
 */

/**
 * Base class for all graph-related errors
 */
export abstract class GraphError extends Error {
    public readonly code: string;
    public readonly details?: Record<string, unknown>;

    constructor(message: string, code: string, details?: Record<string, unknown>) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Thrown when node data validation fails
 */
export class NodeValidationError extends GraphError {
    constructor(message: string, nodeData?: unknown) {
        super(message, 'NODE_VALIDATION_ERROR', { nodeData });
    }
}

/**
 * Thrown when attempting to add a node that already exists
 */
export class NodeExistsError extends GraphError {
    constructor(nodeId: string) {
        super(`Node with id "${nodeId}" already exists`, 'NODE_EXISTS_ERROR', { nodeId });
    }
}

/**
 * Thrown when attempting to operate on a non-existent node
 */
export class NodeNotFoundError extends GraphError {
    constructor(nodeId: string) {
        super(`Node with id "${nodeId}" not found`, 'NODE_NOT_FOUND_ERROR', { nodeId });
    }
}

/**
 * Thrown when edge/link data validation fails
 */
export class EdgeValidationError extends GraphError {
    constructor(message: string, edgeData?: unknown) {
        super(message, 'EDGE_VALIDATION_ERROR', { edgeData });
    }
}

/**
 * Thrown when attempting to add an edge that already exists
 */
export class EdgeExistsError extends GraphError {
    constructor(edgeId: string) {
        super(`Edge with id "${edgeId}" already exists`, 'EDGE_EXISTS_ERROR', { edgeId });
    }
}

/**
 * Thrown when attempting to operate on a non-existent edge
 */
export class EdgeNotFoundError extends GraphError {
    constructor(edgeId: string) {
        super(`Edge with id "${edgeId}" not found`, 'EDGE_NOT_FOUND_ERROR', { edgeId });
    }
}

/**
 * Thrown when attempting to create an edge with non-existent nodes
 */
export class InvalidEdgeReferencesError extends GraphError {
    constructor(sourceId: string, targetId: string, missingNodeIds: string[]) {
        super(
            `Edge references non-existent nodes: ${missingNodeIds.join(', ')}`,
            'INVALID_EDGE_REFERENCES_ERROR',
            { sourceId, targetId, missingNodeIds }
        );
    }
}

/**
 * Thrown when data structure validation fails
 */
export class DataStructureError extends GraphError {
    constructor(message: string, data?: unknown) {
        super(message, 'DATA_STRUCTURE_ERROR', { data });
    }
}

/**
 * Utility functions for error handling
 */
export class GraphErrorUtils {
    /**
     * Check if an error is a graph-related error
     */
    static isGraphError(error: unknown): error is GraphError {
        return error instanceof GraphError;
    }

    /**
     * Extract error details for logging/debugging
     */
    static getErrorDetails(error: unknown): Record<string, unknown> {
        if (this.isGraphError(error)) {
            return {
                name: error.name,
                code: error.code,
                message: error.message,
                details: error.details
            };
        }

        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message
            };
        }

        return { error: String(error) };
    }

    /**
     * Create a user-friendly error message
     */
    static getUserMessage(error: unknown): string {
        if (this.isGraphError(error)) {
            switch (error.code) {
                case 'NODE_VALIDATION_ERROR':
                case 'EDGE_VALIDATION_ERROR':
                    return 'Invalid data provided. Please check the required fields.';
                case 'NODE_EXISTS_ERROR':
                case 'EDGE_EXISTS_ERROR':
                    return 'Item already exists in the graph.';
                case 'NODE_NOT_FOUND_ERROR':
                case 'EDGE_NOT_FOUND_ERROR':
                    return 'Item not found in the graph.';
                case 'INVALID_EDGE_REFERENCES_ERROR':
                    return 'Cannot create connection to non-existent nodes.';
                default:
                    return error.message;
            }
        }

        return 'An unexpected error occurred.';
    }
}
