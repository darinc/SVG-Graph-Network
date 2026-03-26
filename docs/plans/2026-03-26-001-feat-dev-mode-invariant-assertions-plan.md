---
title: "feat: Add dev-mode invariant assertions"
type: feat
status: completed
date: 2026-03-26
origin: docs/brainstorms/2026-03-26-dev-mode-assertions-requirements.md
---

# feat: Add Dev-Mode Invariant Assertions

## Overview

Add compile-time `__DEV__` flag and targeted assertions that throw in development builds but are completely dead-code-eliminated from production bundles. Targets the 4 silent-failure patterns documented in `docs/solutions/`. (see origin: docs/brainstorms/2026-03-26-dev-mode-assertions-requirements.md)

## Problem Statement

Silent failures are the hardest bugs to find in this codebase. NaN positions propagate through physics without errors, null subsystems silently skip operations via optional chaining, and event callbacks default to empty objects. The existing `debug` flag enables verbose logging but does not catch invariant violations at their point of origin.

## Proposed Solution

A compile-time `__DEV__` boolean via Webpack DefinePlugin, a `devAssert()` utility, and ~10-15 targeted assertions at the 4 known failure boundaries.

## Technical Approach

### Phase 1: Infrastructure (R1, R2)

**1a. TypeScript global declaration**

Create `src/globals.d.ts`:
```typescript
declare const __DEV__: boolean;
```
This is auto-included by `tsconfig.json`'s `"include": ["src/**/*"]` and inherited by `tsconfig.test.json`.

**1b. Webpack DefinePlugin**

File: `webpack.config.cjs`

Add `const webpack = require('webpack');` at line 1.

Add DefinePlugin to `sharedConfig.plugins` (new array) so it applies to all 4 configs (UMD prod, ESM, CJS, UMD dev):
```javascript
plugins: [
  new webpack.DefinePlugin({
    __DEV__: !isProduction
  })
]
```

Production builds (`isProduction = true`) → `__DEV__` replaced with `false` → Terser eliminates dead branches.
Dev builds → `__DEV__` replaced with `true` → assertions active.

ESM/CJS production bundles get `__DEV__: false` baked in at build time (standard library pattern, same as React). Consumers cannot toggle dev assertions — this is intentional.

**1c. Jest configuration**

File: `jest.config.cjs`

Add to the top-level config:
```javascript
globals: {
  __DEV__: true
}
```

This defines `__DEV__` before any module code runs, matching DefinePlugin's compile-time replacement semantics.

**1d. devAssert utility**

Create `src/utils/devAssert.ts`:
```typescript
/**
 * Development-only assertion. Throws in dev builds, completely
 * eliminated from production bundles via dead-code elimination.
 */
export function devAssert(condition: boolean, message: string): asserts condition {
    if (__DEV__) {
        if (!condition) {
            throw new Error(`[SVG-Graph-Network] Assertion failed: ${message}`);
        }
    }
}
```

Not exported from `src/index.ts` — this is internal-only.

### Phase 2: Physics NaN Guards (R3)

File: `src/physics/PhysicsEngine.ts`

Insert assertion **inside the `forEach` in `updatePositions()`**, after `node.updatePosition()` returns (after current line 124):

```typescript
devAssert(
    Number.isFinite(node.position.x) && Number.isFinite(node.position.y),
    `Node "${node.data.id}" has NaN/Infinity position after physics update: (${node.position.x}, ${node.position.y})`
);
```

**Why here and not elsewhere:** `PhysicsEngine.updatePositions()` is the physics boundary — it's the last place force integration happens before positions are consumed by the renderer. Checking here catches NaN regardless of which force calculation (`_calculateRepulsionForce`, `_calculateAttractionForce`, `_calculateGroupingForce`) produced it. Checking every node every frame is acceptable because `Number.isFinite()` is cheap and the physics loop is already O(n²) — one O(n) check adds negligible cost in dev mode.

Also add a velocity check:
```typescript
devAssert(
    Number.isFinite(node.velocity.x) && Number.isFinite(node.velocity.y),
    `Node "${node.data.id}" has NaN/Infinity velocity: (${node.velocity.x}, ${node.velocity.y})`
);
```

### Phase 3: SVGRenderer Element Checks (R4)

File: `src/rendering/SVGRenderer.ts`

**In `createElements()` (after line 233, after `createSVGContainer()`):**
```typescript
devAssert(
    this.linkGroup !== null && this.nodeGroup !== null && this.labelGroup !== null,
    'SVG layer groups are null after createSVGContainer()'
);
```

**In `updateNodePositions()` (inside the forEach, before `setAttribute`):**
When `elements` is null (node has no corresponding DOM element), this is the "event listeners lost after DOM recreation" failure pattern. Add:
```typescript
devAssert(
    elements !== undefined,
    `Node "${node.data.id}" has no DOM element — elements may have been lost after DOM recreation`
);
```

Note: The existing `if (elements)` guard remains — the assertion fires before it, catching the silent skip in dev mode while production still gracefully skips.

### Phase 4: GraphNetwork Initialization Checks (R5)

File: `src/GraphNetwork.ts`

**In `startAnimation()` (before `this.isAnimating = true`, around line 449):**
```typescript
devAssert(this.physics !== null, 'Cannot start animation: PhysicsEngine not initialized');
devAssert(this.renderer !== null, 'Cannot start animation: SVGRenderer not initialized');
devAssert(this.events !== null, 'Cannot start animation: EventManager not initialized');
```

The existing `console.error` + `return` guard in `animate()` (line 490) stays as-is — it provides graceful degradation in production. The `devAssert` in `startAnimation()` catches the problem earlier (before the loop begins) and throws in dev mode.

### Phase 5: EventManager Callback Checks (R6)

File: `src/interaction/EventManager.ts`

**In `initialize()` (after `this.callbacks = callbacks`, around line 203):**
```typescript
devAssert(
    svg !== null && svg !== undefined,
    'EventManager.initialize() called with null/undefined SVG element'
);
devAssert(
    typeof callbacks.onNodeDrag === 'function' || typeof callbacks.onNodeClick === 'function',
    'EventManager.initialize() called with no interaction callbacks — node events will be silently ignored'
);
```

The second assertion catches the documented bug pattern where `eventCallbacks` defaults to `{}` — if no callbacks are registered, node interactions will silently do nothing.

## Acceptance Criteria

- [ ] `__DEV__` flag works: `npm run dev` sets it to `true`, `npm run build` sets it to `false`
- [ ] `devAssert()` throws descriptive errors in dev mode
- [ ] Production bundles contain no assertion code (verify with `npm run size` — no increase)
- [ ] NaN positions in physics throw immediately in dev mode
- [ ] Missing DOM elements after SVG recreation throw in dev mode
- [ ] Null subsystems at animation start throw in dev mode
- [ ] Empty event callbacks at initialization warn in dev mode
- [ ] All 402 existing tests pass with `__DEV__: true`
- [ ] `npm run build` succeeds cleanly
- [ ] `npm run type-check` passes with `globals.d.ts` in place

## Key Decisions (from origin)

- **Compile-time `__DEV__` over runtime `debug` flag** — zero production cost, industry standard (see origin: R1)
- **Targeted assertions over broad defensive checks** — 4 known failure patterns only (see origin: Scope Boundaries)
- **DefinePlugin in `sharedConfig`** — applies to all 4 webpack configs (UMD prod, ESM, CJS, dev), prevents ESM/CJS from shipping undefined `__DEV__` reference
- **`devAssert` in `startAnimation()`, keep existing guard in `animate()`** — assert early (before loop), degrade gracefully in production
- **NaN check inside `PhysicsEngine.updatePositions()` forEach** — catches NaN at the physics boundary regardless of which force calculation produced it
- **ESM/CJS bundles bake `__DEV__: false`** — standard library pattern; consumers cannot toggle dev assertions

## Files Modified

| File | Change |
|------|--------|
| `src/globals.d.ts` | **New** — TypeScript declaration for `__DEV__` |
| `src/utils/devAssert.ts` | **New** — assertion utility |
| `webpack.config.cjs` | Add `require('webpack')`, add DefinePlugin to `sharedConfig` |
| `jest.config.cjs` | Add `globals: { __DEV__: true }` |
| `src/physics/PhysicsEngine.ts` | NaN/Infinity checks in `updatePositions()` |
| `src/rendering/SVGRenderer.ts` | Element existence checks in `createElements()` and `updateNodePositions()` |
| `src/GraphNetwork.ts` | Subsystem non-null checks in `startAnimation()` |
| `src/interaction/EventManager.ts` | SVG and callback checks in `initialize()` |

## Verification

1. `npm run type-check` — TypeScript accepts `__DEV__` references
2. `npm test` — all 402 tests pass with assertions active
3. `npm run build` — production build succeeds
4. `npm run size` — bundle sizes unchanged (dead-code elimination working)
5. Manual: add `devAssert(false, 'test')` in any file, run `npm run dev`, confirm error thrown in browser
6. Manual: confirm the `devAssert(false, 'test')` string does NOT appear in `dist/svg-graph-network.min.js`

## Sources

- **Origin document:** [docs/brainstorms/2026-03-26-dev-mode-assertions-requirements.md](docs/brainstorms/2026-03-26-dev-mode-assertions-requirements.md) — key decisions: compile-time flag, targeted scope, 4 failure patterns
- Learnings: `docs/solutions/runtime-errors/event-listener-loss-after-dom-recreation.md` — explicitly recommends "debug-mode warning when event callbacks are empty"
- Learnings: `docs/solutions/runtime-errors/god-object-decomposition-regression.md` — implicit contracts lost during module extraction
- Learnings: `docs/solutions/patterns/separation-of-concerns-integration-risk.md` — integration boundaries need explicit contracts
- Pattern: React/Vue `__DEV__` flag via DefinePlugin (industry standard)
