---
date: 2026-03-26
topic: dev-mode-assertions
---

# Dev-Mode Invariant Assertions

## Problem Frame

The project's knowledge base identifies "silent failures are the hardest bugs to find" as a recurring theme. Event listeners defaulting to empty objects, NaN positions propagating through physics, and null subsystems silently skipping operations have all caused hard-to-diagnose bugs. The existing `debug` flag enables verbose logging but does not catch invariant violations early. Assertions that throw in development but are completely eliminated from production builds would surface these failures at the point of origin.

## Requirements

- R1. Add a compile-time `__DEV__` flag via Webpack DefinePlugin, set to `true` in development and `false` in production. Production builds must dead-code-eliminate all `if (__DEV__) { ... }` blocks.
- R2. Add a lightweight `devAssert(condition, message)` utility that throws in dev builds and is a no-op in production. This is the single assertion primitive used throughout the codebase.
- R3. Add assertions for NaN/Infinity position and velocity values in `PhysicsEngine` after force integration, so corrupted physics state is caught on the frame it occurs.
- R4. Add assertions in `SVGRenderer` before DOM mutations that verify target elements exist, catching the "event listeners lost after DOM recreation" failure class at the point of origin.
- R5. Add assertions in `GraphNetwork` subsystem initialization that verify critical subsystems (renderer, physics, events) are non-null before the animation loop starts, catching partial initialization.
- R6. Add assertions for empty event callback registrations in `EventManager.initialize()`, catching the known bug pattern where `eventCallbacks` defaults to `{}`.

## Success Criteria

- All assertions are fully eliminated from production bundles (verify via `npm run size` showing no increase).
- Dev server (`npm run dev`) surfaces assertion failures as thrown errors with descriptive messages.
- Existing tests continue to pass without modification (assertions should not fire in correctly-initialized test scenarios).

## Scope Boundaries

- Not adding broad input validation on public API methods (that's a separate concern).
- Not replacing the existing `debug` logging — assertions complement it.
- Not adding assertions to every subsystem — focused on the 4 known silent-failure patterns from the knowledge base.

## Key Decisions

- **Compile-time flag over runtime flag**: `__DEV__` via DefinePlugin is industry standard (React, Vue). Zero production cost, clean dead-code elimination. The existing `debug` flag continues to control verbose logging separately.
- **Targeted over comprehensive**: Focus on the 4 failure patterns documented in `docs/solutions/` rather than broad defensive checks. This keeps the initial scope small and high-value.

## Dependencies / Assumptions

- Webpack DefinePlugin is available (webpack is already the bundler).
- TypeScript needs a global type declaration for `__DEV__` to avoid compile errors.

## Outstanding Questions

### Deferred to Planning

- [Affects R1][Technical] Where should the `__DEV__` TypeScript global declaration live — `src/types/globals.d.ts` or augment an existing `.d.ts` file?
- [Affects R3][Needs research] Should the physics NaN check run on every node every frame, or sample a subset for performance? Check how many nodes the test fixtures use.

## Next Steps

→ `/ce:plan` for structured implementation planning
