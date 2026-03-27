# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.1] - 2026-03-27

### Changed
- CI test matrix reduced from Node 18/20/22 to Node 22.x only (faster CI)
- Minimum Node.js engine bumped from >= 18.0.0 to >= 20.0.0 (Node 18 EOL)

## [0.4.0] - 2026-03-27

### Added
- System dark/light mode auto-detection via `prefers-color-scheme` media query (falls back to dark if unavailable)
- Screenshot added to README

### Changed
- Consolidated theme toggle and settings caret into a single gear button (⚙️)
- Theme toggle moved inside settings panel as a "Light / Dark" toggle switch
- All control button backgrounds changed from green (#38A169) to theme-aware colors (`--bg-primary` with border)
- Settings panel no longer has section headings — cleaner minimal layout
- Default physics tuning: Repulsion 7.5 (was 13), Attraction 12.6 (was 10)
- Default title changed from "Graph Network" to "SVGnet"
- Gear icon stays static regardless of panel open/close state

### Removed
- Standalone theme toggle button from controls bar
- `--button-primary` and `--button-primary-hover` CSS custom properties
- `'theme'` option from `setControlEnabled()` / `isControlEnabled()` / `getButton()` (internal API)

## [0.3.0] - 2026-03-27

### Added
- Graph state serialization via `exportState()` / `importState()` for persisting layouts across sessions
- Custom node shape registration via `registerShape(name, creator)` with `INodeShapeFactory` interface
- Directed edge support: `LinkData.directed` property with per-edge and global `defaultDirected` config
- Pluggable layout algorithms: `LayoutStrategy` interface with `ForceDirectedLayout` and `StaticLayout` implementations
- Viewport culling: off-screen nodes and links hidden to reduce DOM writes on large graphs
- Adaptive physics cooldown: simulation drops to ~2fps when equilibrium detected, wakes on interaction
- Dev-mode invariant assertions via compile-time `__DEV__` flag (dead-code-eliminated in production)
- CI bundle size enforcement (`npm run size` in CI workflow)
- Centralized coordinate conversion (`screenToGraph`, `screenToContainer`)

### Changed
- Project renamed from `svg-graph-network` to `SVGnet` (npm package `svgnet`, UMD global `SVGNet`)
- GitHub repo renamed from `darinc/SVG-Graph-Network` to `darinc/SVGnet`
- Build output files renamed: `SVGnet.min.js`, `SVGnet.esm.js`, `SVGnet.cjs`, `SVGnet.css`
- GitHub Pages URL updated to `darinc.github.io/SVGnet/`
- `NodeData.shape` widened from literal union to `string` to support custom shapes
- README rewritten for library adoption (removed "educational only" positioning)
- LICENSE copyright updated to Darin Chambers
- Removed 25 skipped integration tests that were blocked by jsdom limitations (underlying features work correctly)
- Added `prepublishOnly` script to ensure build + test pass before every publish

### Removed
- Dead infrastructure code: DependencyContainer, EventBus, GraphDataManager, GraphAnimationController, RenderingCoordinator, NodeElementManager, LinkElementManager, SVGDOMManager (-4,049 lines)
- Duplicate CoordinateConverter (-284 lines)
- Stale styles-backup.css (-1,061 lines)

## [0.2.0] - 2026-03-15

### Added
- npm publishing support with ESM, CommonJS, and UMD builds
- Automatic color generation for undefined node types
- TypeScript declaration files (.d.ts) ship with the package
- CDN support via jsDelivr and unpkg
- Size limit checks (35KB gzipped budget)

### Fixed
- XSS remediation in SVG rendering
- Circular dependency cleanup across modules
- Dependency vulnerability fixes

## [0.1.0] - 2026-02-01

### Added
- Force-directed graph layout with configurable physics (repulsion, attraction, grouping, damping)
- Dark and light theme support with runtime switching
- Mobile-first touch gestures: pinch-to-zoom, drag, double-tap filtering
- Node shapes: circle, rectangle, square, triangle
- Link styles: solid, dashed, dotted with custom colors
- Multi-level node filtering by connection depth
- Event system for integration (nodeDoubleClick, themeChanged, filtered, zoom, etc.)
- Programmatic API: addNode, removeNode, addEdge, removeEdge, setData
- Selection API with single/multi/box modes
- Highlight API with path highlighting and neighbor depth
- Style API for per-element customization
- Camera API with focusOnNode, fitToView, centerView
- Dynamic legends that update with data
- Configurable grid backgrounds
- CSS custom properties for full theme control
- Keyboard accessibility support
- Zero runtime dependencies
