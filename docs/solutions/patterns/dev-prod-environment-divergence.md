---
title: "Pattern: Dev/Prod Environment Divergence"
category: patterns
date: 2026-03-25
tags: [dev-prod-divergence, build, ci, deployment]
supporting_learnings:
  - build-errors/umd-global-variable-name-mismatch
  - build-errors/ci-artifact-check-wrong-filename
  - ui-bugs/css-positioning-broke-ui-overlay-layer
---

## Pattern

Multiple bugs in this project surfaced only in production (GitHub Pages, CI) and not during local development. The root causes differ, but the pattern is consistent: **behavior that works in dev mode breaks in production because the two environments differ in ways the developer didn't account for.**

## Examples

- **`document.write` blocked in production** but works in dev (CSP differences).
- **Async script loading timing** differs between webpack-dev-server (which bundles inline) and production (which loads separate script files).
- **Webpack output filenames** differ between modes (`[name].js` vs `[name].min.js`).
- **CSS rendering** can differ when dev tools or browser extensions alter layout behavior.

## Mitigation

1. **Test the production build locally** before deploying: `npm run build` then serve `dist/` with a static file server.
2. **Use `scripts/validate-build.cjs`** — it checks that expected artifacts exist after a production build.
3. **CI should mirror production** — run the same build mode and verify the same artifacts that will be deployed.
4. **Avoid conditional behavior based on environment** in consumer-facing code (examples, docs). When unavoidable, test both paths.
