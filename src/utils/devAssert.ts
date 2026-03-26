/**
 * Development-only assertion. Throws in dev builds, completely
 * eliminated from production bundles via dead-code elimination.
 */
export function devAssert(condition: boolean, message: string): asserts condition {
    if (__DEV__) {
        if (!condition) {
            throw new Error(`[svgnet] Assertion failed: ${message}`);
        }
    }
}
