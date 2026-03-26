# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A zero-dependency TypeScript library for rendering interactive, physics-based graph networks as SVG. Outputs UMD, ESM, and CJS builds. Bundle size limit: 35KB gzipped.

## Commands

```bash
npm run build          # Clean + type-check + webpack production build + validate
npm run dev            # Dev server at localhost:8080 with hot reload
npm run watch          # Webpack watch mode (no server)
npm test               # Jest test suite
npm test -- --testPathPattern="SVGRenderer"  # Run a single test file by name
npm run test:watch     # Jest watch mode
npm run test:coverage  # Coverage report
npm run lint           # ESLint on src/
npm run lint:fix       # Auto-fix lint issues
npm run type-check     # TypeScript check (no emit)
npm run size           # Bundle size analysis
npm run docs           # Generate TypeDoc API docs
```

## Architecture

**Orchestration pattern:** `GraphNetwork` is the top-level orchestrator that composes all subsystems. It directly instantiates and coordinates each subsystem via constructor wiring and callback-based communication.

**Core subsystems:**

- **Physics** (`src/physics/`) — Force simulation: repulsion, attraction, grouping forces. `PhysicsEngine` calculates forces, `PhysicsManager` manages simulation lifecycle. Completely isolated from rendering. Adaptive cooldown drops to ~2fps when equilibrium is detected, wakes on interaction.
- **Rendering** (`src/rendering/`) — SVG DOM management. `SVGRenderer` and `NodeShapeFactory`. Layers: links (bottom) → nodes → edge labels (top). Viewport culling hides off-screen elements to reduce DOM writes on large graphs.
- **Interaction** (`src/interaction/`) — Mouse/touch event handling, viewport transforms. Touch uses a state machine pattern for gestures. Coordinate conversion is centralized in `src/interaction/utils/coordinates.ts` (`screenToGraph`, `screenToContainer`).
- **UI** (`src/ui/`) — Controls, legend, breadcrumbs, title, settings panels via sub-managers under `UIManager`.
- **Theming** (`src/theming/`) — Dark/light themes, CSS custom properties, `AutoColorGenerator` for node type colors.
- **Highlighting** (`src/highlighting/`) — Path, neighbor, and focus highlighting with visual states.
- **Camera** (`src/camera/`) — Viewport pan/zoom via `CameraController`.
- **Selection** (`src/selection/`) — `SelectionManager` for node/edge selection state.
- **Styling** (`src/styling/`) — `StyleManager` for runtime style application.
- **Errors** (`src/errors/`) — Typed error classes (`NodeNotFoundError`, `EdgeExistsError`, etc.).

**Public API** is defined in `src/index.ts`: default export is `GraphNetwork`, with named exports for `Vector`, `Node`, `AutoColorGenerator`, and all TypeScript types. Changes to exports affect the package's public surface.

**Key types** are in `src/types/`: `NodeData`, `LinkData`, `GraphData`, `GraphConfig`, plus event and styling types. The `Node` class (`src/Node.ts`) wraps `NodeData` with physics vectors.

## Build

Webpack produces three bundles simultaneously in production:
- **UMD** (`dist/svg-graph-network.min.js` + `.css`) — browser global `SVGGraphNetwork`
- **ESM** (`dist/svg-graph-network.esm.js`) — tree-shakeable
- **CJS** (`dist/svg-graph-network.cjs`) — Node.js

CSS is extracted only in the UMD build; ESM/CJS use null-loader for CSS.

## Testing

- Jest with jsdom environment, ts-jest for TypeScript
- Tests in `tests/unit/` and `tests/integration/`
- Tests use a separate `tsconfig.test.json`
- Setup file: `tests/setup.ts`, config: `jest.config.cjs`

## TypeScript

- Strict mode enabled, target ES2020
- Decorators + reflect-metadata enabled
- Incremental builds via `.tsbuildinfo`

## Dev-Mode Assertions

A compile-time `__DEV__` flag (via Webpack DefinePlugin) enables invariant assertions that throw in dev builds and are dead-code-eliminated from production. `devAssert(condition, message)` in `src/utils/devAssert.ts` is the single assertion primitive. Assertions target: NaN physics positions, missing DOM elements after recreation, null subsystems at animation start, and empty event callbacks. `npm run dev` activates assertions; production bundles contain zero assertion code.

## Pre-commit Hooks

Husky + lint-staged run on commit: ESLint fix + Prettier on `src/` and `tests/` TS/JS files.

## Security

- `escapeHtml()` in `GraphNetwork.ts` for XSS prevention on user-supplied text
- ESLint enforces no-eval, no-implied-eval, no-script-url, no-new-func
