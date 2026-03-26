---
title: Six Feature Regressions from God Object Decomposition
category: runtime-errors
date: 2025-09-11
module: core
component: GraphNetwork, EventManager, SVGRenderer, UIManager
tags: [refactoring, god-object, regression, implicit-contracts]
commits: [abed7d44]
---

## Problem

After extracting the monolithic `GraphNetwork` into separate modules (`EventManager`, `SVGRenderer`, `UIManager`), six distinct features broke simultaneously: double-click filtering, background grid rendering, settings panel visibility, physics slider value mapping, arrow marker sizing, and click-outside-to-close behavior.

## Root Cause

Each bug had a different root cause, all stemming from implicit contracts lost during extraction:

- **Double-click filter reset** — lost reference to the filter callback when moved to `EventManager`.
- **Background grid** — required a wrapper element only constructed in the monolith's DOM setup.
- **Settings panel visibility** — old code used inline `style.display`; new module used a CSS class that was never defined.
- **Physics sliders** — exposed raw 0–1 floats instead of the original user-friendly 0–20 integer scale; the mathematical transformation was dropped during extraction.
- **Arrow markers** — inherited default SVG `markerWidth`/`markerHeight`; explicit attributes from the old rendering code were not carried over.

## Solution

Five targeted fixes across 5 files (232 lines of changes), each restoring the specific behavior that was lost during module extraction.

**Key files:** `src/GraphNetwork.ts`, `src/interaction/EventManager.ts`, `src/rendering/SVGRenderer.ts`, `src/ui/UIManager.ts`

## Prevention

- Before decomposing a god object, write integration tests that verify all user-facing behavior — not unit tests of internals. Run them after the refactoring.
- Large refactorings that split tightly coupled code into modules are high-risk for losing implicit context, default values, and side effects.
- Decompose incrementally (one module at a time) rather than extracting everything at once, to isolate regressions to a single extraction.
