---
title: CI Build Verification Checked for Wrong Artifact Name
category: build-errors
date: 2025-09-17
module: build
component: CI workflow
tags: [ci, artifact-verification, webpack, dev-prod-divergence]
commits: [55b5028e]
---

## Problem

CI failed on the "Verify build artifacts" step even though the build succeeded. The workflow reported a missing file.

## Root Cause

The CI workflow checked for `dist/svgnet.js`, but webpack produces `svgnet.min.js` in production mode (`filename: isProduction ? '[name].min.js' : '[name].js'`). The unminified `.js` file only exists in development mode. CI runs `npm run build` which uses production mode.

## Solution

Changed the CI artifact check from `test -f dist/svgnet.js` to `test -f dist/svgnet.min.js` and added a check for `dist/index.d.ts` (TypeScript declarations).

**Key file:** `.github/workflows/ci.yml`

## Prevention

- CI artifact verification must match the exact output of the build mode being tested.
- When webpack uses conditional filenames based on mode, derive expected filenames from the same configuration, or use glob patterns (`dist/svgnet*.js`) instead of exact names.
- The existing `scripts/validate-build.cjs` script now handles this — prefer extending that over inline CI checks.
