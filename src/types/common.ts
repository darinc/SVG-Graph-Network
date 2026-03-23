/**
 * Shared type definitions used across type modules.
 * Extracted to avoid circular dependencies between types/index.ts and types/styling.ts.
 */

/**
 * 2D position coordinates
 */
export interface Position {
    x: number;
    y: number;
}
