---
title: "chore: Documentation cleanup after ideation sweep"
type: chore
status: completed
date: 2026-03-26
---

# chore: Documentation Cleanup After Ideation Sweep

## Overview

The ideation sweep shipped 6 improvements (dead code removal, dev assertions, physics cooldown, viewport culling, coordinate consolidation, CI size gate) but documentation was not updated to match. Several files reference deleted infrastructure, and new features are undocumented.

## Problem Statement

- `docs/ARCHITECTURE.md` (4,100+ lines) references 9 deleted modules (DependencyContainer, EventBus, RenderingCoordinator, etc.)
- `CLAUDE.md` doesn't mention 3 new features (__DEV__ assertions, viewport culling, physics cooldown)
- `src/styles-backup.css` (1,061 lines) is unused cruft
- `docs/api/media/ARCHITECTURE.md` is a stale duplicate

## Proposed Solution

Four targeted tasks, ordered by impact.

### Task 1: Delete cruft files

- Delete `src/styles-backup.css` (1,061 lines, zero imports)
- Delete `docs/api/media/ARCHITECTURE.md` (stale duplicate of main architecture doc)

### Task 2: Update CLAUDE.md with new features

Add to the Architecture section:

- **Viewport culling** — `SVGRenderer` computes viewport bounds in graph space each frame and sets `display: none` on off-screen nodes/links
- **Physics cooldown** — animation loop drops to ~2fps watchdog when `PhysicsEngine.isInEquilibrium()` detects stable state; wakes on interaction or data changes
- **Dev assertions** — compile-time `__DEV__` flag via Webpack DefinePlugin; `devAssert()` utility in `src/utils/devAssert.ts` throws in dev, eliminated in prod

Add to Commands section:
- Note that `npm run dev` enables `__DEV__` assertions

### Task 3: Rewrite docs/ARCHITECTURE.md

The file is 4,100+ lines and heavily references deleted infrastructure. Rather than surgical edits, rewrite the key sections to reflect the actual architecture:

**Remove all references to:**
- `src/core/` directory (DependencyContainer, GraphDataManager, GraphAnimationController, interfaces)
- `src/events/EventBus.ts`
- `src/rendering/` sub-managers (SVGDOMManager, RenderingCoordinator, NodeElementManager, LinkElementManager)
- `src/interaction/utils/CoordinateConverter.ts`

**Update to reflect:**
- `GraphNetwork` directly instantiates subsystems via constructor wiring
- Coordinate conversion uses shared `src/interaction/utils/coordinates.ts`
- Physics cooldown via equilibrium detection
- Viewport culling in SVGRenderer
- Dev-mode assertions via `__DEV__` flag

### Task 4: Verify .gitignore coverage

Check that `dist/` and `coverage/` are in `.gitignore`. If they're tracked by git despite being gitignored, note for the user but don't force-remove (that's a destructive operation requiring explicit approval).

## Acceptance Criteria

- [ ] `src/styles-backup.css` deleted
- [ ] `docs/api/media/ARCHITECTURE.md` deleted
- [ ] `CLAUDE.md` documents viewport culling, physics cooldown, and __DEV__ assertions
- [ ] `docs/ARCHITECTURE.md` has zero references to deleted modules
- [ ] `docs/ARCHITECTURE.md` documents the actual current architecture
- [ ] `npm run build` still succeeds (no broken imports from deleted CSS)
- [ ] `npm test` still passes

## Scope Boundaries

- Not rewriting README.md, API.md, EXAMPLES.md, etc. (these were assessed as current)
- Not removing `docs/api/` from git tracking (generated docs are used for GitHub Pages deployment)
- Not touching TODO.md (active roadmap, still accurate)
