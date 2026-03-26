---
title: XSS via innerHTML in Tooltip Rendering
category: security-issues
date: 2026-03-23
module: rendering
component: GraphNetwork
tags: [xss, innerHTML, sanitization, tooltip]
commits: [2cf22be5]
---

## Problem

Node tooltips used `innerHTML` to render user-provided data (node names, types, and custom field values) without sanitization. A malicious node name like `<img src=x onerror=alert(1)>` would execute arbitrary JavaScript.

## Root Cause

The tooltip builder concatenated user-supplied strings directly into HTML fragments: `` `<strong>${node.getName()}</strong>` ``. Since these values come from the `GraphData` object supplied by consumers (potentially sourced from APIs, user input, or databases), they are untrusted.

## Solution

Introduced `escapeHtml()` in `GraphNetwork.ts` that replaces `&`, `<`, `>`, `"`, and `'` with HTML entity equivalents. Applied to all user-supplied values: `node.getName()`, `node.getType()`, custom field names, and custom field values.

The custom `TooltipConfig.formatter` callback intentionally does **not** auto-escape — consumers must sanitize their own output. This is documented with a JSDoc warning on the `formatter` property.

**Key files:** `src/GraphNetwork.ts` (escapeHtml function), `src/types/index.ts` (TooltipConfig.formatter docs)

## Prevention

- Any library rendering user-supplied data via `innerHTML` must escape it — even "internal" libraries, since the data may originate from untrusted sources.
- ESLint rules (`no-eval`, `no-implied-eval`, `no-script-url`, `no-new-func`) are enforced to prevent other injection vectors.
- When exposing a custom formatter callback, document the security responsibility clearly.
