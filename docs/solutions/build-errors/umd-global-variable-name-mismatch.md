---
title: UMD Global Variable Name Mismatch Across Dev/Prod
category: build-errors
date: 2025-09-18
module: build
component: webpack config, examples
tags: [umd, global-variable, document-write, async-loading, dev-prod-divergence]
commits: [c590417e, 621ee58f, 0b5ccae5, 1669574b]
---

## Problem

GitHub Pages examples showed blank pages with "Can't find variable: SVGGraphNetwork" errors. The library loaded but no graph appeared. Required four separate commits over two days to fully resolve.

## Root Cause

A chain of three entangled issues:

1. **`document.write` blocked in production:** Examples used `document.write` to conditionally load scripts. Modern browsers and CSPs block this for dynamically inserted scripts, causing silent load failures on GitHub Pages.
2. **Async script loading race condition:** After replacing `document.write` with `createElement/appendChild`, the library loaded asynchronously but example JS ran synchronously, referencing the global before the library loaded.
3. **Wrong global variable name:** Examples referenced `SVGGraphNetwork` but webpack's `output.library` exported `GraphNetwork` (or vice versa during the alignment process).

## Solution

1. Replaced all `document.write` with `document.createElement('script')` + `appendChild`.
2. Added `script.onload` handlers that trigger initialization, plus `DOMContentLoaded` listeners checking library availability.
3. Aligned all references to match the actual webpack `output.library` name.

**Key files:** `docs/examples/basic.html`, `docs/examples/basic.js`, webpack config (`output.library`)

## Prevention

- UMD global variable names are a contract between the build system and consumers. When `output.library` changes, every consumer must be updated.
- Test the actual deployed output (e.g., GitHub Pages), not just the dev server — `document.write`, async timing, and name mismatches only surface in production environments.
- Consider a build validation script that verifies the global variable name matches what examples reference.
