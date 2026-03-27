---
title: "feat: Add missing features — serialization, custom shapes, directed edges, pluggable layouts"
type: feat
status: completed
date: 2026-03-26
---

# feat: Missing Features for v1.0

## Overview

Four features prioritized by implementation effort (low → medium) and value. Ordered so each builds on the previous — serialization is standalone, custom shapes extends the factory, directed edges extends rendering, and pluggable layouts is the largest change.

## Implementation Units

### Unit 1: Graph State Serialization (Low effort)

**Goal:** Add `exportState()` / `importState()` round-trip for the full graph including node positions, so layouts persist across sessions.

**Files:**
- `src/GraphNetwork.ts` — add `exportState()` and `importState()` public methods
- `src/types/index.ts` — add `GraphState` interface

**Approach:**
- `Node.toObject()` already serializes position/velocity/isFixed (Node.ts:235-249)
- `Node.fromObject()` already restores from serialized state (Node.ts:266-294)
- `NodeCreationOptions` already accepts `x`, `y`, `fixed` (types/index.ts:270-283)
- `getData()` returns `{ nodes, links }` but strips positions — add a parallel method

```typescript
// New public API
exportState(): GraphState {
    return {
        nodes: Array.from(this.nodes.values()).map(n => n.toObject()),
        links: this.getLinks(),
        transform: this.renderer?.getTransform() ?? { x: 0, y: 0, scale: 1 }
    };
}

importState(state: GraphState): void {
    // 1. Extract NodeData[] and LinkData[] from serialized state
    // 2. Call setData({ nodes, links }, { preservePositions: true })
    // 3. Restore positions from serialized nodes (setData creates Nodes at random positions)
    //    — iterate state.nodes, find matching Node by id, set position.x/y, call fix() if wasFixed
    // 4. Restore camera transform via renderer.setTransform() + events.setTransform()
    // 5. Wake physics only if any nodes are unfixed
}
```

**Verification:** Round-trip test — export, clear, import, verify positions match and camera transform is restored.

---

### Unit 2: Custom Shape Registration (Low effort)

**Goal:** Expose `registerShape()` on the public API so consumers can add diamond, hexagon, image, or icon node shapes.

**Files:**
- `src/GraphNetwork.ts` — add `registerShape()` method that delegates to the factory
- `src/types/index.ts` — widen `NodeData.shape` from literal union to `string`
- `src/rendering/NodeShapeFactory.ts` — update `registerCreator()` to accept any shape name (currently hardcoded to `['circle', 'rectangle', 'square', 'triangle']`)
- `src/index.ts` — export `INodeShapeFactory`, `ShapeResult`, `BaseShapeCreator`

**Approach:**
- `NodeShapeFactory.registerCreator()` is already public (NodeShapeFactory.ts:224)
- `INodeShapeFactory` interface already exists (NodeShapeFactory.ts:16-19)
- `BaseShapeCreator` abstract class exists for shape authors to extend (NodeShapeFactory.ts:24-42)
- The bottleneck is the `NODE_SHAPES` const and literal union type that blocks custom names

**Changes:**
1. Widen `NodeData.shape` from `'circle' | 'rectangle' | 'square' | 'triangle'` to `string`
2. Remove the `supportedShapes` filter in `registerCreator()` — let any shape name register
3. Add `GraphNetwork.registerShape(name: string, creator: INodeShapeFactory)` — passes through to `SVGRenderer.shapeFactory`
4. Export types from `src/index.ts`

**Learnings to apply:** Custom shapes trigger `createElements()` which recreates DOM — event listeners must be re-bound (from `event-listener-loss-after-dom-recreation.md`). The existing `devAssert` in `SVGRenderer.updateNodePositions()` will catch this in dev mode.

**Verification:** Register a diamond shape, create a node with `shape: 'diamond'`, verify it renders.

---

### Unit 3: Directed Edge Support (Low-Medium effort)

**Goal:** Add `directed` property to `LinkData`. When `true`, render an arrowhead; when `false`, no arrowhead. When undefined, fall back to `GraphConfig.defaultDirected` (default: `true` to preserve current visual behavior where all edges have arrowheads).

**Files:**
- `src/types/index.ts` — add `directed?: boolean` to `LinkData`
- `src/rendering/SVGRenderer.ts` — conditionally apply `marker-end` based on `link.data.directed`
- `src/highlighting/HighlightManager.ts` — respect direction in BFS adjacency building

**Approach:**
- Currently `marker-end` is applied unconditionally (SVGRenderer.ts:259)
- `HighlightManager.updateGraphStructure()` adds both `source→target` and `target→source` to adjacency (HighlightManager.ts:398-399)
- Physics attraction is already symmetric and doesn't need direction changes

**Changes:**
1. Add `directed?: boolean` to `LinkData` interface
2. In `createLinkElements()`: only set `marker-end` when `link.data.directed === true` (or when a global config default says directed)
3. In `HighlightManager.updateGraphStructure()`: only add reverse edge when `!directed`
4. Add `GraphConfig.defaultDirected?: boolean` for global default

**Learnings to apply:** Arrow marker sizing has broken before during refactoring — set explicit `markerWidth`/`markerHeight` attributes (from `god-object-decomposition-regression.md`).

**Verification:** Create a graph with mixed directed/undirected edges. Verify arrowheads appear only on directed edges. Verify path highlighting respects direction.

---

### Unit 4: Pluggable Layout Algorithms (Medium effort)

**Goal:** Extract a `LayoutStrategy` interface so consumers can provide tree, radial, or grid layouts as alternatives to force-directed.

**Files:**
- `src/physics/LayoutStrategy.ts` — **new** interface definition
- `src/physics/ForceDirectedLayout.ts` — **new** wrapper around existing `PhysicsEngine`
- `src/physics/PhysicsManager.ts` — accept `LayoutStrategy` instead of hardcoding `PhysicsEngine`
- `src/GraphNetwork.ts` — accept `layout` option in config, pass to `PhysicsManager`
- `src/types/index.ts` — add layout config types

**Approach:**

```typescript
// New interface
interface LayoutStrategy<T extends NodeData = NodeData> {
    start(): void;
    stop(): void;
    tick(nodes: Map<string, Node<T>>, links: PhysicsLink<T>[], filteredNodes: Set<string> | null): SimulationMetrics;
    isStable(): boolean;
    updateConfig(config: Partial<PhysicsConfig>): void;
}
```

- `ForceDirectedLayout` wraps the existing `PhysicsEngine` + equilibrium detection
- `PhysicsManager` constructor accepts `layout?: LayoutStrategy` with `ForceDirectedLayout` as default
- A `StaticLayout` (no physics, just fixed positions) is trivial and useful for tests
- The animation loop already checks `isInEquilibrium()` — `isStable()` generalizes this

**Learnings to apply:** Extract shared types into leaf modules to prevent circular deps (from `circular-dependency-between-type-modules.md`). Decompose incrementally — ship the interface + ForceDirectedLayout wrapper first, add alternative layouts later.

**Verification:**
- Existing force-directed behavior unchanged (all 402 tests pass)
- `StaticLayout` works: set positions manually, no physics simulation runs
- Can pass custom layout in `GraphNetwork` constructor config

---

## Scope Boundaries

- Not adding built-in tree/radial/grid layout implementations — just the strategy interface + one static layout for validation
- Not changing physics force calculations — the existing engine is wrapped, not replaced
- Not adding edge weight to physics (was rejected during ideation)
- Not building a visual shape editor — just the registration API

## Acceptance Criteria

- [ ] `exportState()` / `importState()` round-trips positions correctly
- [ ] Custom shapes can be registered and render via public API
- [ ] `INodeShapeFactory`, `ShapeResult`, `BaseShapeCreator` exported from package
- [ ] `directed: true` edges show arrowheads; `directed: false` or unset do not
- [ ] Path highlighting respects edge direction
- [ ] `LayoutStrategy` interface exists and `ForceDirectedLayout` wraps existing physics
- [ ] All existing 402 tests pass after each unit
- [ ] `npm run build` + `npm run size` pass (within 35KB gzip budget)

## Dependencies & Risks

- **Type widening for shapes**: Changing `NodeData.shape` from literal union to `string` is a minor breaking change for TypeScript consumers who pattern-match on shape values. Acceptable pre-1.0.
- **Bundle size**: Four features add code. Monitor with `npm run size` after each unit.
- **Event listener loss risk**: Custom shapes and directed edges may trigger `createElements()`. Existing `devAssert` catches this in dev mode.

## Sources

- Research: `NodeShapeFactory` extensibility (NodeShapeFactory.ts:224, INodeShapeFactory:16-19)
- Research: `Node.toObject()/fromObject()` (Node.ts:235-294)
- Research: `LinkData` interface (types/index.ts:30-47)
- Research: `HighlightManager.updateGraphStructure()` BFS (HighlightManager.ts:370-401)
- Learnings: `docs/solutions/runtime-errors/event-listener-loss-after-dom-recreation.md`
- Learnings: `docs/solutions/runtime-errors/god-object-decomposition-regression.md`
- Learnings: `docs/solutions/build-errors/circular-dependency-between-type-modules.md`
