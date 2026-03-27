---
title: "docs: Update website, documentation, and API docs for new features"
type: docs
status: completed
date: 2026-03-27
---

# docs: Update All Documentation for New Features

## Overview

Four features were added but not documented: graph state serialization, custom shape registration, directed edge support, and pluggable layout strategies. All markdown docs, the GitHub Pages site, and TypeDoc config need updates.

## Implementation Units

### Unit 1: CHANGELOG.md

Add all new features to the Unreleased section:
- `exportState()` / `importState()` for layout persistence
- `registerShape()` + `INodeShapeFactory` / `ShapeResult` exports
- `LinkData.directed` + `GraphConfig.defaultDirected`
- `LayoutStrategy` interface + `ForceDirectedLayout` + `StaticLayout`
- Also: viewport culling, adaptive physics cooldown, dev-mode assertions, coordinate consolidation, dead code removal, CI size gate, project rename to svgnet

### Unit 2: API.md

Add new sections for:
- **State Management**: `exportState()`, `importState()`, `GraphState` type
- **Custom Shapes**: `registerShape(name, creator)`, `INodeShapeFactory`, `ShapeResult`, `BaseShapeCreator`
- **Directed Edges**: `LinkData.directed`, `GraphConfig.defaultDirected` — update existing LinkData and GraphConfig docs
- **Layout Strategy**: `LayoutStrategy` interface, `ForceDirectedLayout`, `StaticLayout`, `SimulationMetrics`, constructor `options.layout`

### Unit 3: README.md

Update:
- Feature list — add state serialization, custom shapes, directed edges, pluggable layouts
- Quick example showing directed edges and layout persistence
- TypeScript types section — mention new exports

### Unit 4: EXAMPLES.md

Add practical examples for:
- Saving/restoring layout with `exportState()`/`importState()`
- Registering a custom diamond shape
- Mixed directed/undirected edges
- Using `StaticLayout` for pre-computed positions

### Unit 5: TYPESCRIPT.md

Add TypeScript-specific sections for:
- `GraphState` type usage with `exportState()`/`importState()`
- Implementing `INodeShapeFactory` for custom shapes
- Implementing `LayoutStrategy` for custom layouts
- Typed directed edges with `LinkData`

### Unit 6: GETTING_STARTED.md

Add "Advanced Features" section briefly mentioning:
- Layout persistence
- Custom shapes
- Directed edges
- Custom layouts
Link to EXAMPLES.md and API.md for details.

### Unit 7: CLAUDE.md + docs/ARCHITECTURE.md

Update:
- CLAUDE.md: Add serialization, custom shapes, directed edges, LayoutStrategy to relevant sections
- docs/ARCHITECTURE.md: Add LayoutStrategy pattern to Physics section and Design Patterns table, mention custom shape extensibility, state serialization API

### Unit 8: docs/index.html

Update the feature list and JSON-LD metadata to include:
- Layout persistence / state serialization
- Custom node shapes
- Directed & undirected edges
- Pluggable layout algorithms

### Unit 9: typedoc.json + regenerate API docs

Update typedoc category configuration, then run `npm run docs` to regenerate.

## Acceptance Criteria

- [ ] CHANGELOG.md Unreleased section lists all new features from this session
- [ ] API.md documents exportState, importState, registerShape, directed edges, LayoutStrategy
- [ ] README.md feature list includes the 4 new capabilities
- [ ] EXAMPLES.md has working code examples for each new feature
- [ ] TYPESCRIPT.md documents new exported types with examples
- [ ] GETTING_STARTED.md mentions advanced features
- [ ] CLAUDE.md and ARCHITECTURE.md reflect current architecture
- [ ] docs/index.html feature list updated
- [ ] `npm run build` passes
- [ ] `npm run docs` generates updated TypeDoc output

## Scope Boundaries

- Not rewriting entire docs from scratch — surgical updates only
- Not creating interactive demo pages (that's a separate initiative)
- Not updating the `docs/api/` generated HTML beyond running `npm run docs`
