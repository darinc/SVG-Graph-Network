---
title: Circular Dependency Between Type Modules Broke Bundling
category: build-errors
date: 2026-03-23
module: types, theming
component: types/index, types/styling, ThemeManager, AutoColorGenerator
tags: [circular-dependency, webpack, typescript, module-extraction]
commits: [2cf22be5]
---

## Problem

Two pairs of circular dependencies existed:
1. `types/index.ts` ↔ `types/styling.ts` — both needed the `Position` interface.
2. `ThemeManager` ↔ `AutoColorGenerator` — theme configuration interfaces lived inside `ThemeManager`.

In TypeScript with webpack, circular imports can cause modules to be `undefined` at evaluation time, leading to cryptic runtime errors that don't point to the circular dependency.

## Root Cause

Shared types (`Position`, theme interfaces) were defined in one module of a pair that had a legitimate dependency on the other, creating a cycle.

## Solution

Extracted shared types into dedicated leaf modules with no further imports:
- `src/types/common.ts` for `Position`
- `src/theming/types.ts` for theme interfaces (`ThemeConfig`, `NodeStyleConfig`, `EdgeStyleConfig`, etc.)

Both original modules import from the leaf, breaking the cycle. A re-export in `types/index.ts` preserved the public API.

**Key files:** `src/types/common.ts`, `src/theming/types.ts`

## Prevention

- When two modules need the same type and also depend on each other, extract the shared type into a third "leaf" module with no imports from either.
- Re-export from the original location to avoid breaking the public API.
- Circular dependencies may work in development (when module evaluation order happens to be favorable) but break in production builds — always test the production bundle.
