---
title: "Pattern: Separation of Concerns Creates Integration Risk"
category: patterns
date: 2026-03-25
tags: [refactoring, god-object, event-listeners, circular-dependency, integration-testing]
supporting_learnings:
  - runtime-errors/event-listener-loss-after-dom-recreation
  - build-errors/circular-dependency-between-type-modules
  - runtime-errors/god-object-decomposition-regression
---

## Pattern

Decomposing tightly coupled code into separate modules is a net positive for maintainability, but it repeatedly introduced subtle bugs in this project. Each time, **implicit contracts** (shared state, side effects, default values, event re-binding) were lost during the extraction.

## Examples

- **Event listeners lost after DOM recreation** — the rendering layer and interaction layer are managed by separate components, but re-binding listeners after DOM recreation was not part of either component's explicit contract.
- **Circular dependencies in type modules** — shared types lived in one module of a pair, creating import cycles that worked in dev but broke in production builds.
- **Six simultaneous regressions from god-object decomposition** — implicit context, mathematical transformations, and CSS class definitions were spread across the monolith and lost when code was split into modules.

## Mitigation

1. **Write integration tests before refactoring** that verify user-facing behavior, not internal implementation. Run them after each extraction.
2. **Decompose incrementally** — one module at a time — to isolate regressions.
3. **Extract shared types into leaf modules** with no imports from either consumer, to prevent circular dependencies.
4. **Document implicit contracts** (e.g., "listeners must be re-bound after DOM recreation") as code comments at the integration boundary.
