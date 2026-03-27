---
date: 2026-03-26
topic: project-rename-SVGnet
---

# Rename Project to SVGnet

## Problem Frame

The current name `svgnet` is generic, long, and competes with every graph library in search results. The library needs a shorter, punchier name before v1.0 to establish brand identity. `SVGnet` is available on npm and captures the essence: SVG + network in 6 characters.

## Requirements

- R1. Rename the npm package from `svgnet` to `SVGnet` in `package.json` (name, description, repository, homepage, bugs, exports paths, file references).
- R2. Update the UMD global variable name from `SVGNet` to `SVGNet` in the webpack config (`output.library.name`).
- R3. Update all output filenames from `svgnet.*` to `SVGnet.*` (`.min.js`, `.esm.js`, `.cjs`, `.css`).
- R4. Update `scripts/validate-build.cjs` to check for the new filenames.
- R5. Update `CLAUDE.md`, `README.md`, `docs/ARCHITECTURE.md`, and all documentation references to the old name.
- R6. Update example HTML files in `docs/examples/` to reference the new filenames and global variable.
- R7. Update CI workflows (`.github/workflows/`) to reference new artifact names.
- R8. Update `size-limit` config in `package.json` to reference new filenames.

## Success Criteria

- `npm run build` succeeds with all new filenames
- `npm run size` passes with new paths
- `npm test` passes (402 tests)
- `npm pack` produces `svgnet-0.2.0.tgz` with correct contents
- UMD build exposes `window.SVGNet` global
- All documentation references the new name consistently

## Scope Boundaries

- Not renaming the GitHub repository (that's a GitHub settings change the owner does manually)
- Not changing the TypeScript class names (`GraphNetwork` stays — it's the public API, not the package name)
- Not incrementing the version number (the rename itself is the v1.0 prep, not the release)

## Key Decisions

- **Package name:** `SVGnet` (confirmed available on npm)
- **UMD global:** `SVGNet` (matches the package name pattern, short)
- **Output files:** `SVGnet.min.js`, `SVGnet.esm.js`, `SVGnet.cjs`, `SVGnet.css`
- **Class names unchanged:** `GraphNetwork`, `Node`, `Vector`, `AutoColorGenerator` stay as-is (they describe what they are, not the brand)

## Outstanding Questions

### Deferred to Planning

- [Affects R6][Needs research] How many example HTML files reference the old global name or filenames? Need to enumerate them all.
- [Affects R3][Technical] Does the webpack config's `clean: false` on ESM/CJS configs need adjustment for new filenames?

## Next Steps

→ `/ce:plan` for structured implementation planning
