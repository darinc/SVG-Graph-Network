---
title: "feat: Add npm Dependency Explorer demo"
type: feat
status: completed
date: 2026-03-27
origin: docs/brainstorms/2026-03-27-npm-dependency-demo-requirements.md
---

# feat: Add npm Dependency Explorer Demo

## Overview

Create a polished demo page that visualizes an npm-style dependency graph, showcasing the SVGNet library's full feature set: directed edges, path highlighting, vulnerability overlays, depth filtering, node shapes, grouping, and theming. This is a "look what you can build" showcase aimed at potential library users.

## Problem Statement / Motivation

The library has three demos (basic, advanced diplomatic networks, internal module dependencies) but none showcase a universally relatable real-world use case. Every JS developer understands npm dependency graphs. This demo will demonstrate the library's capabilities in a context that immediately resonates with the target audience. (see origin: `docs/brainstorms/2026-03-27-npm-dependency-demo-requirements.md`)

## Proposed Solution

A single-page demo (`docs/examples/npm-explorer.html` + `npm-explorer.js`) with a curated ~40 node dataset modeled after an Express-like package ecosystem. Three interactive showcases: path tracing, vulnerability overlay, and depth filtering.

**Note:** The filename `dependency-graph.html` is already taken (used for internal module dependency visualization). This demo uses `npm-explorer.html`.

## Technical Considerations

### Critical: Path Direction for `highlightPath`

The library's `HighlightManager.findShortestPath()` uses BFS that only follows forward adjacency for directed edges (source → target). If edges are modeled as `dependent → dependency` (e.g., `express → body-parser`), then `highlightPath(body-parser, express)` will fail — BFS can't traverse backward.

**Solution:** Call `highlightPath(rootId, transitiveDepId)` (forward direction from root to transitive dep). The visual result still shows the chain; arrowheads indicate dependency direction correctly.

### Critical: Click Detection

The library emits `nodeMouseDown`, not `nodeClick`. Path tracing requires distinguishing click from drag-start:
- Track mousedown position and time
- On mouseup, if same node, <200ms elapsed, <5px movement → treat as click
- This is standard click detection and can be implemented in the demo JS

### Important: Click vs Double-Click Disambiguation

Single-click triggers path tracing (R5), double-click triggers depth filtering (R7, built-in behavior). These conflict on the same node.

**Solution:** Delay path trace by 250ms after single click. If `nodeDoubleClick` fires within that window, cancel the path trace and let filtering proceed.

### Important: Interaction State Machine

Three visual states can overlap. State priority rules:

| Current State | Action | Result |
|---|---|---|
| Normal | Click transitive dep | Path trace highlights |
| Normal | Toggle vuln overlay | Vuln coloring applies |
| Normal | Double-click node | Depth filter activates |
| Path highlighted | Click another node | Replace path highlight |
| Path highlighted | Click background | Clear highlights |
| Path highlighted | Toggle vuln overlay | Clear path, apply vuln |
| Path highlighted | Double-click node | Clear path, filter |
| Vuln overlay active | Click node | No path trace (vuln mode takes priority) |
| Vuln overlay active | Toggle vuln OFF | Restore normal coloring |
| Vuln overlay active | Double-click node | Filter (vuln colors persist on visible nodes) |
| Filtered | Click transitive dep | Path trace within filtered view |
| Filtered | Toggle vuln overlay | Vuln colors on visible nodes |

### Vulnerability Overlay Implementation

`setNodeTypeStyle()` changes all nodes of a type — too coarse for per-node security status. Instead:
- Use `highlightNeighbors()` or manual style application via DOM for individual node coloring
- Mark 2-3 curated packages as "vulnerable" with upstream chains as attack paths
- Use `highlightPath()` to show compromised dependency chains in red

### Security

Per institutional learnings: any user-supplied text in tooltips must be escaped via `escapeHtml()`. The curated dataset is hardcoded so risk is low, but maintain the pattern for consistency.

## Acceptance Criteria

### Functional Requirements

- [ ] **R1.** New demo at `docs/examples/npm-explorer.html` + `npm-explorer.js` loads and renders correctly
- [ ] **R2.** Curated dataset of ~30-50 nodes with realistic npm package names and dependency relationships
- [ ] **R3.** Nodes visually distinguished by type: root (circle, larger), direct deps (rectangle), dev deps (triangle), transitive deps (circle, smaller)
- [ ] **R4.** All edges directed with arrowheads (`defaultDirected: true`)
- [ ] **R5.** Path tracing: clicking a transitive dep highlights the full chain to root with animation
- [ ] **R6.** Vulnerability overlay: toggle button recolors nodes by security status (green/amber/red) and highlights compromised chains
- [ ] **R7.** Depth filtering: double-clicking any package filters to its neighborhood with breadcrumb navigation back
- [ ] **R8.** Instruction panel on first load explaining the three interactive features, dismissible, with localStorage persistence
- [ ] **R9.** Works with both light and dark themes

### Quality Gates

- [ ] Graph settles into a readable layout within 2-3 seconds
- [ ] No console errors during normal interaction
- [ ] Works in both `npm run dev` (localhost:8080) and production build (static files)
- [ ] All three interactive features work without visual glitches or conflicts

## Implementation Plan

### Phase 1: Data and Structure

**Files:** `docs/examples/npm-explorer.html`, `docs/examples/npm-explorer.js`

1. Create `npm-explorer.html` following the established demo pattern:
   - Standard meta tags, CSS link to `../assets/svgnet.css`
   - Dynamic script loader (dev vs production detection)
   - Layout: sidebar with stats/controls + main graph area (similar to existing `dependency-graph.html`)
   - Instruction overlay panel (dismissible)
   - Vulnerability toggle button in sidebar
   - Stats section: total packages, direct deps, dev deps, transitive deps

2. Create curated dataset in `npm-explorer.js` (inline, not external JSON):
   - Root: `my-app` (type: "root", shape: circle, size: 50)
   - ~8 direct deps: `express`, `lodash`, `axios`, `react`, `webpack`, `dotenv`, `cors`, `morgan`
   - ~5 dev deps: `jest`, `eslint`, `prettier`, `typescript`, `nodemon`
   - ~25 transitive deps: realistic sub-dependencies (e.g., express → `body-parser`, `cookie-parser`, `qs`, `debug`, `mime`; axios → `follow-redirects`; webpack → `tapable`, `enhanced-resolve`, `watchpack`)
   - Vulnerability data: mark `qs` (critical), `debug` (warning) as vulnerable, with chains: `my-app → express → body-parser → qs` and `my-app → express → debug`

3. Initialize `SVGNet` with:
   ```javascript
   new SVGNet('graph-container', {
       data: { nodes, links },
       config: {
           title: 'npm Dependency Explorer',
           theme: 'light',
           showControls: true,
           showLegend: true,
           showBreadcrumbs: true,
           defaultDirected: true,
           filterDepth: 2
       }
   });
   ```

4. Set custom node type styles via `setNodeTypeStyle()` for root, direct, dev, transitive types

### Phase 2: Interactive Features

5. **Click detection layer** — implement mousedown/mouseup tracking to produce reliable click events from `nodeMouseDown`:
   ```javascript
   let pendingClick = null;
   graph.on('nodeMouseDown', (event) => {
       // Record mousedown state
   });
   document.addEventListener('mouseup', (event) => {
       // If same node, <200ms, <5px → schedule click with 250ms delay
       // If double-click fires within window → cancel pending click
   });
   ```

6. **Path tracing (R5):**
   - On click of a transitive dep node, call `highlightPath(rootId, clickedNodeId, { pathColor: '#ff6b6b', pathWidth: 4, animate: true })`
   - Note: call with root as source, transitive as target (forward BFS direction)
   - On click background or non-transitive node → `clearHighlights()`
   - Clicking another transitive dep replaces the highlight

7. **Vulnerability overlay (R6):**
   - Toggle button in sidebar: "Show Vulnerabilities"
   - When ON: apply CSS classes or direct SVG style changes to mark nodes by security status
   - Use `highlightPath()` to show compromised chains in red
   - When OFF: restore original type-based coloring
   - Clears any active path highlights when toggled

8. **Depth filtering (R7):**
   - Built-in double-click behavior handles this automatically
   - Add 250ms delay to path trace to avoid conflict with double-click
   - Breadcrumbs are built-in via `showBreadcrumbs: true`

### Phase 3: Polish

9. **Instruction panel (R8):**
   - Floating overlay on first load with three feature descriptions
   - "Got it" button dismisses and stores in `localStorage`
   - Key hints: "Click a package to trace its dependency chain", "Toggle vulnerabilities to see security risks", "Double-click to zoom into a package's neighborhood"

10. **Theme support (R9):**
    - Theme toggle is built-in
    - Ensure custom vulnerability colors work in both light and dark themes
    - Test instruction panel styling in both themes

11. **Testing:**
    - Test in `npm run dev` mode
    - Test with `npm run build` + static file server
    - Verify all three features work without conflicts
    - Verify physics settle into readable layout

## Scope Boundaries

- No live npm registry API calls — fully curated data (see origin)
- No "paste your package.json" functionality (see origin)
- No actual vulnerability scanning — hand-assigned statuses (see origin)
- No new library features required — uses only existing public API (see origin)
- No changes to existing demos

## Dependencies & Risks

- **Risk:** Physics may not produce readable layout for 40+ nodes in 2-3s. Mitigation: tune physics params (increase damping, adjust repulsion) or seed initial positions.
- **Risk:** Click vs drag discrimination may be finicky on touch devices. Mitigation: this demo targets desktop showcase; touch is a nice-to-have.
- **Risk:** `nodeMouseDown` event may not provide sufficient data for click detection. Mitigation: verify event payload includes node ID and coordinates during Phase 2.

## Sources & References

### Origin

- **Origin document:** [docs/brainstorms/2026-03-27-npm-dependency-demo-requirements.md](docs/brainstorms/2026-03-27-npm-dependency-demo-requirements.md) — Key decisions: curated data over live API, Express-like ecosystem, three feature showcases (path tracing, vulnerability overlay, depth filtering).

### Internal References

- Existing demo pattern: `docs/examples/basic.html` + `basic.js`
- Advanced demo with selection/highlighting: `docs/examples/advanced.js`
- Existing dependency graph demo: `docs/examples/dependency-graph.html`
- Public API: `src/index.ts`, `src/GraphNetwork.ts`
- HighlightManager pathfinding: `src/highlighting/HighlightManager.ts:397-401`
- Event system: `src/interaction/EventManager.ts:285`

### Institutional Learnings

- UMD global is `SVGNet`, use `createElement/appendChild` for script loading (never `document.write`)
- Test demos against production build before declaring done
- SVG canvas must use `position: absolute` for correct overlay positioning
- Custom tooltip formatters must sanitize output via `escapeHtml()`
