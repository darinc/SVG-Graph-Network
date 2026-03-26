---
title: Event Listener Loss After Dynamic DOM Recreation
category: runtime-errors
date: 2025-09-14
module: interaction
component: EventManager, SVGRenderer
tags: [event-listeners, dom-recreation, silent-failure, drag-interaction]
commits: [bb42701e, b01e08f0]
---

## Problem

After adding or removing nodes dynamically via `addNode()` or `addLink()`, all node drag interactions silently stopped working. Background pan/zoom still functioned, making the bug appear intermittent.

## Root Cause

The renderer recreated all SVG DOM elements when graph data changed (`createElements()`), but `EventManager.initialize()` was called with only 2 arguments instead of 3. The third argument — `eventCallbacks` — defaulted to `{}`, so the `getNodeElements` callback was never registered. Node-level event listeners were never reattached to the fresh DOM elements.

Background interactions still worked because they are bound to the SVG root element, which persists across rerenders.

## Solution

Two-part fix:

1. Pass `this.eventCallbacks` as the third argument to `EventManager.initialize()` during initial setup.
2. Re-invoke `this.events.initialize(svg, nodes, eventCallbacks)` after every `createElements()` call in both `addNode` and `addLink` code paths.

**Key files:** `src/GraphNetwork.ts` (addNode/addLink methods), `src/interaction/EventManager.ts`

## Prevention

- When a renderer destroys and recreates DOM elements, all event listeners attached to those elements are lost. Any system that separates rendering from event handling must re-bind listeners after DOM recreation.
- Silent failure (no error thrown) makes this class of bug especially dangerous — consider adding a debug-mode warning when event callbacks are empty.
- Integration tests that verify drag behavior after `addNode()` would catch this regression.
