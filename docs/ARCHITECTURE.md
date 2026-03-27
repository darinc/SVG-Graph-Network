# SVGnet - Architecture

## Overview

`GraphNetwork` is the top-level orchestrator. It directly instantiates all subsystems via constructor wiring and coordinates them through callbacks. There is no dependency injection container or event bus — communication flows through direct method calls and callback objects.

## Component Architecture

### GraphNetwork (`src/GraphNetwork.ts`)

The main entry point (~3,400 lines). Owns all subsystem instances, the animation loop, and the public CRUD/query API. Instantiates subsystems in `initializeModules()` and drives the render loop via `requestAnimationFrame`. Key public methods include `exportState()` / `importState()` for layout persistence and `registerShape()` for custom node shapes.

### Physics (`src/physics/`)

- **PhysicsEngine** — Force calculations: repulsion (O(n²) pairwise), attraction (per-link), grouping (per-type). Returns `SimulationMetrics` including `totalEnergy` and `maxForce`.
- **PhysicsManager** — Simulation lifecycle: start/stop/pause/resume, configuration management.
- **LayoutStrategy** (interface) — Pluggable layout algorithm contract: `tick()`, `isStable()`, `updateConfig()`, `getConfig()`. Two built-in implementations:
  - **ForceDirectedLayout** — Default. Wraps `PhysicsEngine` for force-directed simulation.
  - **StaticLayout** — No-op layout for pre-computed positions (useful for tests and server-rendered graphs).

The animation loop in `GraphNetwork.animate()` uses **adaptive cooldown**: when `isStable()` detects equilibrium, physics drops to a ~2fps watchdog tick. Interaction (drag, data change, filter reset) calls `wakePhysics()` to resume. Custom layouts can be passed via `options.layout` in the `GraphNetwork` constructor.

### Rendering (`src/rendering/`)

- **SVGRenderer** — Creates and manages all SVG DOM elements. Layers: links (bottom) → nodes → edge labels (top). Applies CSS transforms for pan/zoom.
- **NodeShapeFactory** — Factory pattern for node shapes. Built-in: circle, rectangle, square, triangle. Extensible via `registerShape(name, creator)` for custom shapes (diamond, hexagon, icons, etc.).

**Viewport culling**: Each frame, `getViewportBoundsInGraphSpace()` computes the visible area. Nodes outside this area get `display: none`, skipping expensive DOM attribute writes. Links where both endpoints are off-screen are also hidden. A 100-unit padding margin prevents visible popping at edges.

### Interaction (`src/interaction/`)

- **EventManager** — Coordinates mouse and touch handlers. Receives callbacks from `GraphNetwork` for node operations (drag, click, filter).
- **MouseInteractionHandler** — Mouse events: drag, pan, wheel zoom.
- **TouchInteractionHandler** — Touch events with a state machine pattern: single-finger pan/drag, two-finger pinch-to-zoom, double-tap detection.
- **TransformManager** — Viewport transform operations (zoom to point, pan).
- **InteractionEventEmitter** — Internal event system for interaction handlers.

**Coordinate conversion** is centralized in `src/interaction/utils/coordinates.ts`:
- `screenToGraph(clientX, clientY, svgRect, transform)` — screen → graph coordinates
- `screenToContainer(clientX, clientY, svgRect)` — screen → container-relative coordinates

### UI (`src/ui/`)

**UIManager** delegates to focused sub-managers:
- **UIControlsManager** — Zoom buttons, theme toggle, settings toggle
- **UILegendManager** — Node type/shape legend
- **UIBreadcrumbsManager** — Filter navigation breadcrumbs
- **UITitleManager** — Graph title display
- **UISettingsManager** — Physics control sliders, settings panel

### Theming (`src/theming/`)

- **ThemeManager** — Dark/light themes, CSS custom properties, visual state management (hover, selected, active).
- **AutoColorGenerator** — Automatic HSL color assignment for node types.

### Other Subsystems

- **CameraController** (`src/camera/`) — Programmatic viewport control: focus on nodes, fit-to-view, animated transitions with easing.
- **HighlightManager** (`src/highlighting/`) — Path, neighbor, and focus highlighting with depth-based styling.
- **SelectionManager** (`src/selection/`) — Node/edge selection state with single/multi modes.
- **StyleManager** (`src/styling/`) — Runtime style application and visual state management.
- **GraphErrors** (`src/errors/`) — Typed error classes: `NodeNotFoundError`, `EdgeExistsError`, etc.

## Dev-Mode Assertions

A compile-time `__DEV__` flag (Webpack DefinePlugin) enables invariant assertions that are dead-code-eliminated from production builds. The `devAssert()` utility (`src/utils/devAssert.ts`) targets 4 known silent-failure patterns:

1. NaN/Infinity positions and velocities in `PhysicsEngine.updatePositions()`
2. Missing DOM elements before mutation in `SVGRenderer.updateNodePositions()`
3. Null subsystems at animation start in `GraphNetwork.startAnimation()`
4. Missing event callbacks in `EventManager.initialize()`

## Design Patterns

| Pattern | Implementation |
|---------|---------------|
| **Factory** | `NodeShapeFactory` for node shape creation |
| **State Machine** | `TouchInteractionHandler` for gesture recognition |
| **Composition** | `UIManager` composes 5 sub-managers; `EventManager` composes mouse/touch handlers |
| **Callback Delegation** | `GraphNetwork` passes callback objects to subsystems for cross-cutting operations |
| **Strategy** | `LayoutStrategy` interface for pluggable layout algorithms (`ForceDirectedLayout`, `StaticLayout`) |

## Testing

- **Unit tests** (`tests/unit/`) — Each subsystem tested independently
- **Integration tests** (`tests/integration/`) — Cross-subsystem behavior (selection + highlighting, styling + data changes)
- **Setup** — `tests/setup.ts` mocks browser APIs (requestAnimationFrame, DOM, console)
- **Config** — `jest.config.cjs` with `__DEV__: true` in globals

## Build

Webpack produces 3 bundles in production (UMD, ESM, CJS). The `__DEV__` flag is `true` in dev, `false` in production. Bundle size is enforced by `size-limit` in CI (35KB gzip budget).
