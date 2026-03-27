---
date: 2026-03-26
topic: open-ideation
focus: open-ended
---

# Ideation: SVGnet Open Improvement Sweep

## Codebase Context

- TypeScript library (v0.2.0) for interactive, physics-based SVG graph networks. Zero runtime deps.
- 12 subsystem directories under `src/`, orchestrated by `GraphNetwork.ts` (3,424 lines).
- Triple output: UMD/ESM/CJS via webpack. 35KB gzip budget (currently ~22.5KB).
- DI container + EventBus pub/sub architecture exists but is largely unwired — `GraphNetwork` bypasses both via direct instantiation.
- Several rendering sub-managers (`NodeElementManager`, `LinkElementManager`, `RenderingCoordinator`, `SVGDOMManager`) exist with full implementations but zero imports from production code.
- Known patterns from `docs/solutions/`: dev/prod divergence is #1 bug source; refactoring without integration tests caused the worst bugs (6 simultaneous regressions); silent failures are hardest to diagnose; build contracts are fragile.
- Test coverage is thin (~8 files). No CI size checks despite documented budget. `PhysicsEngine.isInEquilibrium()` is computed but never used.

## Ranked Ideas

### 1. Automated Bundle Size Gate in CI
**Description:** Wire `npm run size` into the CI workflow as a failing step on PRs. The 35KB gzip budget, `size-limit` config, and `size:ci` script all exist — the only missing piece is one line in `.github/workflows/ci.yml`.
**Rationale:** The build contract is the #1 source of escaped bugs per the knowledge base. This is a 5-minute change that permanently prevents silent bundle bloat. Maximum leverage per line of code.
**Downsides:** None meaningful. `size-limit` is already a dev dependency.
**Confidence:** 95%
**Complexity:** Low
**Status:** Explored — implemented 2026-03-26 (added `npm run size` step to CI build job)

### 2. Dev-Mode Invariant Assertions Across Subsystems
**Description:** Add a `DEV` flag via Webpack DefinePlugin, then sprinkle cheap invariant checks: NaN position guards in PhysicsEngine, non-null element assertions in SVGRenderer, event callback registration warnings in EventManager. Dead-code-eliminated in production builds.
**Rationale:** Directly addresses the "silent failures are hardest to diagnose" pattern — the #2 theme in the knowledge base. Each assertion is a permanent early-warning sensor that compounds as the codebase grows. Zero production cost.
**Downsides:** Requires discipline to add assertions as new code is written. Initial pass is ~2-3 hours.
**Confidence:** 85%
**Complexity:** Low-Medium
**Status:** Explored — implemented 2026-03-26 (__DEV__ flag + devAssert + 4 assertion sites)

### 3. Delete Dead Infrastructure (DI Container, Rendering Sub-Managers, EventBus Wiring)
**Description:** `DependencyContainer`, `GraphDataManager`, `GraphAnimationController`, `RenderingCoordinator`, `NodeElementManager`, `LinkElementManager`, and `SVGDOMManager` exist with full implementations but are never imported by any live code path. Delete them. This removes ~2,000+ lines of dead code and eliminates the "which architecture is real?" confusion.
**Rationale:** Dead code that looks like the intended architecture is actively misleading. It inflates the apparent complexity of the project and confuses every new contributor. The 35KB budget makes carrying unused modules a concrete cost.
**Downsides:** If the team intended to wire these up later, deleting them loses that work. But they've been unwired across 20+ commits — the intent has expired.
**Confidence:** 80%
**Complexity:** Low
**Status:** Explored — implemented 2026-03-26 (deleted 8 source files + 2 test files, ~2,000 lines removed)

### 4. Adaptive Physics Cooldown (Use the Existing Equilibrium Detection)
**Description:** `PhysicsEngine.isInEquilibrium()` already computes `totalEnergy` and `maxForce` thresholds but is never called. Wire it into the animation loop: when equilibrium is reached, drop to a low-frequency watchdog tick (e.g., 2 fps). Re-activate on user interaction or data change.
**Rationale:** On a settled 100-node graph, the library burns 60 fps of O(n²) force calculations doing nothing. This is the single largest source of wasted CPU. The detection code already exists — this is wiring, not invention.
**Downsides:** Edge cases around re-activation timing (drag start must immediately resume full-speed physics).
**Confidence:** 80%
**Complexity:** Medium
**Status:** Explored — implemented 2026-03-26 (cooldown at equilibrium, wake on interaction/data changes)

### 5. Cross-Subsystem Contract Tests via EventBus
**Description:** Write a small test harness that mounts a real EventBus, fires events from one subsystem (e.g., interaction emits `node:click`), and asserts side effects in consuming subsystems (highlighting, selection, UI). 10-15 contract tests covering the critical event paths.
**Rationale:** The knowledge base's highest-severity finding is "refactoring without integration tests caused 6 simultaneous regressions." Contract tests directly prevent that class of bug and document the event topology that's currently only implicit in GraphNetwork's 3,424 lines.
**Downsides:** Requires understanding the full event flow to write meaningful contracts. May need jsdom for SVG-touching subsystems.
**Confidence:** 75%
**Complexity:** Medium
**Status:** Unexplored

### 6. Viewport Culling for Off-Screen Nodes
**Description:** `SVGRenderer.updateNodePositions()` writes DOM attributes for all nodes every frame, even those panned out of view. The camera transform and bounds are already computed. Add a viewport test per node; set `display: none` on off-screen elements to skip DOM writes.
**Rationale:** This is the primary scalability ceiling. Real-world graphs (500-2,000 nodes) spend most render time writing to invisible elements. Culling is the standard technique and the data structures already exist.
**Downsides:** Edge rendering for links that cross the viewport boundary needs special handling. Culling logic adds per-frame overhead that must be cheaper than the DOM writes it saves.
**Confidence:** 70%
**Complexity:** Medium
**Status:** Explored — implemented 2026-03-26 (viewport bounds culling with 100-unit padding)

### 7. Coordinate System Consolidation
**Description:** Three independent implementations convert screen-to-SVG coordinates: `SVGRenderer.screenToSVG()`, `CoordinateConverter` (standalone file), and inline math in `TouchInteractionHandler`. Consolidate into a single `CoordinateSystem` service that owns all transforms (`screenToSVG`, `svgToPhysics`, `physicsToScreen`).
**Rationale:** Coordinate bugs depend on container position, scroll, and zoom state simultaneously — they're among the hardest to reproduce. Three implementations means three places to introduce drift if `TransformState` changes.
**Downsides:** Requires touching interaction, rendering, and physics integration points. Risk of the exact regression pattern documented in the knowledge base.
**Confidence:** 65%
**Complexity:** Medium
**Status:** Explored — implemented 2026-03-26 (shared coordinates.ts, deleted dead CoordinateConverter)

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Thin GraphNetwork god object | Too risky without integration tests first (lesson from knowledge base) |
| 2 | Options bag proliferation | Low urgency pre-1.0; can break API freely |
| 3 | Fix NodeData index signature | Breaking change better suited to 1.0 planning |
| 4 | Pluggable layout algorithms | High complexity, low urgency at v0.2 |
| 5 | Event listener DOM recreation fix | Known fix — just implement it, don't ideate on it |
| 6 | Directed vs undirected edges | New feature, not quality/leverage improvement |
| 7 | Custom shape registration | Low leverage, cosmetic |
| 8 | Build manifest (single source of truth) | Over-engineering for 3-file build |
| 9 | Stable dev/prod filename | Marginal; validate script covers it |
| 10 | Cleanup stale files | Trivial housekeeping |
| 11 | Collapse triple-bundle build | Premature optimization of <10s build |
| 12 | Typed EventBus contract | Subsumed by contract tests (#5) |
| 13 | Edge physics semantics | New feature, not improvement |
| 14 | Serializable graph state | Valid but better as a feature brainstorm |
| 15 | Barnes-Hut spatial indexing | High complexity; adaptive cooldown (#4) captures 80% of the value |
| 16 | Physics snapshot regression tests | Good but subsumed by contract tests (#5) as a testing investment |

## Session Log
- 2026-03-26: Initial open-ended ideation — 38 raw ideas generated across 5 frames, deduped to 25 unique + 3 cross-cutting combos, 7 survivors after adversarial filtering
- 2026-03-26: Implemented #1 (CI size gate) and #3 (dead code removal)
- 2026-03-26: Implemented #2 (dev-mode invariant assertions)
- 2026-03-26: Implemented #4 (adaptive physics cooldown)
- 2026-03-26: Implemented #6 (viewport culling)
- 2026-03-26: Implemented #7 (coordinate system consolidation)
