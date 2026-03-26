---
title: CSS Positioning Broke UI Overlay Layer
category: ui-bugs
date: 2025-11-17
module: rendering
component: styles.css
tags: [css, positioning, overlay, ui-controls]
commits: [6ba10ff4]
---

## Problem

All UI overlay elements (controls panel, legend, settings panel) appeared below the graph canvas instead of floating on top of it. The graph itself rendered correctly.

## Root Cause

The `.graph-network-canvas` class used `position: relative`, which kept the SVG canvas in the normal document flow. The container uses `position: relative` as the positioning context, and UI elements use `position: absolute` to overlay. Since the canvas occupied the full container height in document flow, the absolutely-positioned UI elements were pushed below the visible area or rendered behind the canvas.

## Solution

Changed `.graph-network-canvas` from `position: relative` to `position: absolute` with `top: 0; left: 0`, removing it from document flow. UI elements (already absolutely positioned) now overlay correctly.

**Key file:** `src/styles.css`

## Prevention

- In a layered UI architecture where a full-size canvas sits behind overlay controls, the canvas must be taken out of document flow (`position: absolute` or equivalent).
- This is a one-line CSS fix but the symptom (UI elements invisible or misplaced) is easily misdiagnosed as a JavaScript problem. Check CSS positioning first when overlays disappear.
