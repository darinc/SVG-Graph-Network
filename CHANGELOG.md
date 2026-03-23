# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- README rewritten for library adoption (removed "educational only" positioning)
- LICENSE copyright updated to Darin Chambers
- Removed 25 skipped integration tests that were blocked by jsdom limitations (underlying features work correctly)
- Added `prepublishOnly` script to ensure build + test pass before every publish

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
