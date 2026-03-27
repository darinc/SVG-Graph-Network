---
title: "chore: Publish SVGnet to npm"
type: chore
status: active
date: 2026-03-27
---

# chore: Publish SVGnet to npm

## Overview

First-time publish of the `SVGnet` library to npm. The package is already well-configured (triple-format builds, TypeScript declarations, exports map, prepublishOnly gate). This plan covers the few fixes needed, account setup, and the actual publish workflow.

## Current State

**What's already good:**
- `name: svgnet` — available on npm (confirmed: 404)
- Triple build: UMD (`SVGnet.min.js`), ESM (`SVGnet.esm.js`), CJS (`SVGnet.cjs`)
- TypeScript declarations (`.d.ts` + `.d.ts.map`) generated
- `exports` field with conditional `import`/`require`/`browser` + CSS subpath
- `prepublishOnly: "npm run build && npm test"` safety gate
- `sideEffects: ["**/*.css"]` for tree-shaking
- CDN support via `jsdelivr` and `unpkg` fields
- MIT license, README with badges and quick start
- Bundle size: ~28 KB gzipped (within 35 KB limit)

## Pre-Publish Fixes

### Fix 1: Repository URL mismatch
~~The GitHub repo was `darinc/SVG-Graph-Network` but has been renamed to `darinc/SVGnet` to match.~~  **Done** — repo renamed, references updated.

### Fix 2: Clean up `files` array
- Remove `"examples"` — directory doesn't exist at the package root
- Consider removing `"src"` — adds ~800KB for no runtime benefit (`.d.ts` files already provide types). Keep it if you want IDE "go to source" via declaration maps.

### Fix 3: Update Node engine
Change `"node": ">= 14.0.0"` to `"node": ">= 18.0.0"` — Node 14 and 16 are EOL.

## Publish Walkthrough

### Phase 1: npm Account Setup (one-time, done by you)

These steps require interactive login — Claude can't do them for you.

1. **Create an npm account** at https://www.npmjs.com/signup
2. **Enable 2FA** — npm requires it for publishing. Use a TOTP app (1Password, Authy, Google Authenticator) or a security key
3. **Verify your email** on npmjs.com
4. **Log in from CLI:**
   ```bash
   npm login
   ```
   This opens a browser flow. Follow the prompts.

### Phase 2: Pre-Publish Validation (Claude can help)

```bash
# 1. Clean build
npm run build

# 2. All tests pass
npm test

# 3. Lint clean
npm run lint

# 4. Type check
npm run type-check

# 5. Bundle size within limits
npm run size

# 6. Review what ships in the tarball
npm pack --dry-run

# 7. Optional: validate package.json for publishing issues
npx publint

# 8. Optional: validate TypeScript exports resolve correctly
npx attw --pack .

# 9. Test the tarball as a consumer would
npm pack
cd /tmp && mkdir svgnet-test && cd svgnet-test && npm init -y
npm install /path/to/svgnet-0.2.0.tgz
node -e "const s = require('svgnet'); console.log('CJS OK:', typeof s.default)"
node --input-type=module -e "import SVGNet from 'svgnet'; console.log('ESM OK:', typeof SVGNet)"
```

### Phase 3: Publish

```bash
# Dry run first — shows what would happen without actually publishing
npm publish --dry-run

# If everything looks good:
npm publish
```

That's it. Your package will be live at https://www.npmjs.com/package/svgnet within seconds.

### Phase 4: Verify (post-publish)

```bash
# Confirm it's live
npm view svgnet

# Install in a fresh project to verify
cd /tmp && mkdir verify-svgnet && cd verify-svgnet && npm init -y
npm install svgnet
node -e "const s = require('svgnet'); console.log(s)"
```

## Future: CI Publishing with Provenance

For subsequent releases, set up GitHub Actions to publish automatically on release tags with provenance attestation. This cryptographically proves the package was built from your repo. Add to package.json:

```json
"publishConfig": { "provenance": true }
```

And create `.github/workflows/publish.yml`:

```yaml
name: Publish
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm test
      - run: npm publish --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

This is optional for the first publish — you can publish locally first and add CI later.

## Gotchas

- **You cannot unpublish after 72 hours.** Use `npm publish --dry-run` first.
- **Version 0.x.y signals instability** to consumers. Fine for now; bump to 1.0.0 when the API is stable.
- **The `prepare` script runs `husky`** on consumer install — it no-ops gracefully outside a git repo, but verify this with the tarball test.
- **`"type": "module"` in package.json** means `.js` files are ESM. Your CJS file correctly uses `.cjs` extension — don't rename it.

## Acceptance Criteria

- [ ] npm account created with 2FA enabled
- [ ] package.json fixes applied (repo URL, files array, node engine)
- [ ] `npm pack --dry-run` output reviewed and looks clean
- [ ] Tarball tested locally (CJS import, ESM import both work)
- [ ] `npm publish` succeeds
- [ ] Package visible at https://www.npmjs.com/package/svgnet
- [ ] `npm install svgnet` works in a fresh project
