---
title: "Consolidate UI settings controls: merge theme toggle into settings panel"
category: ui-bugs
date: 2026-03-27
tags:
  - ui
  - settings-panel
  - theme-toggle
  - dark-mode
  - css-variables
  - feature-consolidation
component: ui-controls-subsystem
severity: low
root_cause_type: design-debt
---

# Consolidate UI settings controls: merge theme toggle into settings panel

## Problem

Two separate circular buttons occupied the bottom-right corner of the graph container:
- **Theme toggle** (moon/sun emoji) for switching light/dark mode
- **Settings toggle** (`^`/`v` caret) for opening the physics settings panel

Both used a bright green `#38A169` background (`--button-primary` CSS variable) that clashed with the graph's theme colors. The caret character was unintuitive as a settings indicator. The theme toggle was architecturally misplaced in the controls layer rather than being a setting, and there was no system theme auto-detection.

## Root Cause

Design debt from incremental feature additions. The theme toggle was added as a standalone button because it was the simplest approach at the time, and button colors were hardcoded to green without considering theme awareness. The settings panel was titled "Physics Settings" and scoped only to physics controls, so the theme toggle had no natural home.

## Solution

### 1. Consolidated buttons into a single gear icon

Removed the standalone theme toggle button. Replaced the `^` caret on the settings button with a static `⚙️` gear emoji. The gear stays static regardless of panel open/close state (the panel itself indicates state).

### 2. Moved theme toggle into settings panel

Added a "Dark Mode" toggle switch as the first section in the settings panel, with "Appearance" and "Physics" section headings separated by a divider. The toggle uses a CSS-only sliding track/thumb pattern.

```typescript
// UISettingsManager.createThemeToggle()
const track = document.createElement('div');
this.setElementClass(track, 'toggle-track');
if (this.config.theme === 'dark') {
    track.classList.add('active');
}

const thumb = document.createElement('div');
this.setElementClass(thumb, 'toggle-thumb');
track.appendChild(thumb);

track.addEventListener('click', () => {
    this.callbacks.onToggleTheme?.();
});
```

### 3. Changed button colors to theme-aware

Replaced green `--button-primary` with `--bg-primary` + `border: 1px solid var(--border-color)` on all control buttons (gear, zoom, reset). Hover uses `--bg-secondary`. Removed `--button-primary` and `--button-primary-hover` CSS variables entirely.

### 4. Added system theme auto-detection

When no explicit `theme` config is passed, the constructor detects the OS preference:

```typescript
if (!options.config?.theme) {
    try {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.config.theme = prefersDark ? 'dark' : 'light';
    } catch {
        // matchMedia not available (e.g., SSR/jsdom) — keep default
    }
}
```

### 5. Synced theme toggle on programmatic changes

`GraphNetwork.setTheme()` now calls `ui.updateThemeToggle(theme)` to keep the settings panel toggle in sync when the theme is changed programmatically.

## Files Changed

| File | Changes |
|------|---------|
| `src/styles.css` | Removed green vars, theme-aware buttons, toggle switch styles |
| `src/ui/managers/UIControlsManager.ts` | Removed theme button, gear emoji, static icon |
| `src/ui/managers/UISettingsManager.ts` | Added theme toggle section, onToggleTheme callback |
| `src/ui/UIManager.ts` | Mirrored changes (dual implementation) |
| `src/GraphNetwork.ts` | Theme sync + system auto-detection |
| `tests/unit/ui/UIManager.test.ts` | Updated for new panel structure |

## Key Decisions

- **Toggle switch row** over emoji button or segmented control — matches the existing slider pattern better.
- **Border + shadow** for button visibility against `--bg-primary` — keeps buttons discoverable without being visually heavy.
- **All buttons changed** from green (not just gear) — consistent visual language.
- **Panel stays open** after theme toggle — lets users toggle back without reopening.
- **Gear stays static** — no `^`/`v` flip needed since the open panel itself provides state indication.

## Prevention & Best Practices

### Dual implementation gotcha

Both `UIManager.ts` (monolith) and the extracted managers (`UIControlsManager`, `UISettingsManager`) contain overlapping code. Changes must be applied to both until the monolith delegates to the managers. Recommendation: wire the extracted managers as delegates so `UIManager` forwards calls instead of duplicating logic.

### Settings panel visibility

Always use the `.is-open` CSS class for settings panel visibility, never `style.display`. A past regression (see `docs/solutions/runtime-errors/god-object-decomposition-regression.md`) was caused by mixing these approaches.

### CSS variable contract

Removing `--button-primary` is a breaking change for anyone using the CSS variables externally. For a published library, deprecated variables should be aliased for at least one minor version before removal.

## Related Documentation

- [CSS positioning broke UI overlay layer](../ui-bugs/css-positioning-broke-ui-overlay-layer.md) — UI overlay stacking architecture
- [God object decomposition regression](../runtime-errors/god-object-decomposition-regression.md) — settings panel visibility regression from extraction
- [Separation of concerns integration risk](../patterns/separation-of-concerns-integration-risk.md) — meta-pattern for decomposition risks
