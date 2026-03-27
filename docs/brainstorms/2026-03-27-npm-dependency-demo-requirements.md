---
date: 2026-03-27
topic: npm-dependency-demo
---

# npm Dependency Explorer Demo

## Problem Frame
The library has two demos (basic and diplomatic networks) but neither showcases a real-world use case that developers immediately relate to. An npm dependency graph demo would resonate with every JS developer, demonstrate the library's full feature set in a coherent scenario, and serve as a compelling "look what you can build" showcase.

## Requirements

- R1. Create a new demo page (`docs/examples/dependency-graph.html` + `dependency-graph.js`) that visualizes an npm-style dependency graph
- R2. Curate a hardcoded dataset of ~30-50 nodes modeled loosely after a real package ecosystem (e.g., Express-like), with realistic package names and dependency relationships
- R3. Nodes must be typed as `direct`, `dev`, and `transitive` dependencies, each with a distinct shape and auto-color grouping
- R4. All edges must be directed (dependencies flow from dependent → dependency)
- R5. **Path tracing:** Clicking any transitive dependency highlights the full dependency chain back to the root package using `highlightPath()` with animation
- R6. **Vulnerability overlay:** A toggle button recolors nodes by security status (safe/warning/critical) and highlights compromised dependency chains. At least 2-3 packages should be marked as "vulnerable" with their upstream chains shown as attack paths
- R7. **Depth filtering:** Double-clicking any package filters to its dependency neighborhood with breadcrumb navigation back to the full graph
- R8. Demo must include a brief instruction panel or tooltip explaining the three interactive features so first-time visitors know what to try
- R9. Demo should work with both light and dark themes (theme toggle already provided by the library)

## Success Criteria
- A developer visiting the demo page immediately understands what the library can do
- All three interactive features (path tracing, vulnerability overlay, depth filtering) work without bugs
- The demo loads instantly (no external API calls) and the physics settle into a readable layout within 2-3 seconds
- The curated data produces a visually balanced graph — not too sparse, not too cluttered

## Scope Boundaries
- No live npm registry API calls — data is fully curated and hardcoded
- No "paste your package.json" functionality
- No actual vulnerability scanning — security statuses are hand-assigned for visual impact
- No new library features required — demo uses only existing public API

## Key Decisions
- **Curated over live data:** Ensures instant load, no API dependency, and full control over visual presentation
- **Express-like ecosystem:** Familiar to most JS developers, has a rich dependency tree with interesting structure
- **Three feature showcases:** Path tracing, vulnerability overlay, and depth filtering were chosen as the highest-impact visual demonstrations of the library's capabilities

## Outstanding Questions

### Deferred to Planning
- [Affects R2][Needs research] Exact package names and dependency structure to use — should be realistic but doesn't need to exactly match any real package
- [Affects R6][Technical] How to implement the vulnerability toggle — likely via `setData()` to update node colors/styles, or potentially a custom overlay approach
- [Affects R8][Technical] Best UI pattern for the instruction panel — floating overlay, sidebar, or inline hints

## Next Steps
→ `/ce:plan` for structured implementation planning
