---
title: "feat: Consolidate settings and theme toggle into gear button"
type: feat
status: completed
date: 2026-03-27
---

# feat: Consolidate settings and theme toggle into gear button

## Overview

Replace the two bottom-right control buttons (theme toggle + settings caret) with a single gear button. Move the theme toggle inside the settings modal as a toggle switch row. Change all control button backgrounds from green to theme-aware colors.

## Problem Statement

The current UI has two circular buttons in the bottom-right corner:
- **Theme toggle** — moon/sun emoji, switches light/dark
- **Settings toggle** — `^`/`v` caret, opens physics settings panel

This is visually noisy and the green (`#38A169`) buttons clash with the graph's color palette. The caret symbol (`^`) is not intuitive.

## Proposed Solution

1. **Remove the standalone theme toggle button** from the controls bar
2. **Replace `^` text** with a ⚙️ gear emoji on the settings button
3. **Add a "Dark Mode" toggle switch** as the first item in the settings panel
4. **Rename panel title** from "Physics Settings" to "Settings" with section subheadings
5. **Change all control button backgrounds** (gear, zoom, reset) from `--button-primary` (green) to `--bg-primary` with `border: 1px solid var(--border-color)` and existing box-shadow for visibility
6. **Gear emoji stays static** regardless of panel open/close state (the open panel itself indicates state)

## Technical Approach

### CSS Changes (`src/styles.css`)

**Button color variables:**
```css
/* Change button backgrounds from green to theme-aware */
.graph-network-settings-toggle,
.graph-network-theme-toggle,   /* remove this selector */
.graph-network-zoom-button,
.graph-network-reset-view-button {
    background-color: var(--bg-primary);        /* was --button-primary (#38A169) */
    border: 1px solid var(--border-color);      /* NEW: visibility */
    /* keep existing box-shadow */
}

/* Hover state */
.graph-network-settings-toggle:hover,
.graph-network-zoom-button:hover,
.graph-network-reset-view-button:hover {
    background-color: var(--bg-secondary);      /* was --button-primary-hover */
}
```

**New toggle switch styles:**
```css
/* Theme toggle switch inside settings panel */
.graph-network-theme-switch { /* toggle switch container */ }
.graph-network-theme-switch input[type="checkbox"] { /* hidden checkbox */ }
.graph-network-theme-switch .toggle-track { /* sliding track */ }
.graph-network-theme-switch .toggle-thumb { /* sliding thumb */ }
```

**Button text color:** Change from `color: white` to `color: var(--text-primary)` so emoji/text remains visible against the theme background.

**Cleanup:** Remove `.graph-network-theme-toggle` selector from button group styles. The `--button-primary` and `--button-primary-hover` CSS variables can be removed from `:root` and `[data-theme="light"]` if no other selectors reference them.

### UIControlsManager (`src/ui/managers/UIControlsManager.ts`)

- **Remove** theme toggle button creation (lines ~147-164)
- **Remove** `updateThemeToggle()` method
- **Change** settings toggle `textContent` from `'^'` to `'⚙️'`
- **Change** `toggleSettings()` to keep gear emoji static (remove the `^`/`v` flip)
- **Remove** theme-related entries from `getButton()`, `setControlEnabled()`, `isControlEnabled()`
- **Update** `getControlCount()` to reflect one fewer button

### UISettingsManager (`src/ui/managers/UISettingsManager.ts`)

- **Add** `onToggleTheme` callback to `UISettingsCallbacks` interface
- **Add** `createThemeToggle()` method that creates a toggle switch row:
  - Label: "Dark Mode"
  - Checkbox input styled as a toggle switch
  - Checked state reflects current theme
  - On change: calls `onToggleTheme` callback
- **Rename** panel title from `'Physics Settings'` to `'Settings'`
- **Add** section subheadings: "Appearance" (containing theme toggle) and "Physics" (containing existing sliders)
- **Add** `updateThemeToggle(theme: 'light' | 'dark')` method to sync toggle state when theme changes externally

### UIManager (`src/ui/UIManager.ts`)

- **Remove** theme toggle button creation (lines ~452-459)
- **Change** settings toggle `textContent` from `'^'` to `'⚙️'`
- **Remove** `updateThemeToggle()` method (or redirect to settings manager)
- **Wire** the new `onToggleTheme` callback from UISettingsManager to `this.callbacks.onToggleTheme`
- **Update** `toggleSettings()` to keep gear emoji static

### GraphNetwork (`src/GraphNetwork.ts`)

- **Wire** `onToggleTheme` callback to UISettingsManager in addition to (or instead of) UIControlsManager
- **After theme toggle:** call `uiSettingsManager.updateThemeToggle(newTheme)` to keep the checkbox in sync

### Settings Panel Behavior

- **Panel stays open** after toggling theme (existing CSS transitions handle the color change smoothly)
- **Click outside** still closes the panel (existing behavior, no change)
- **Panel structure:**

```
┌─────────────────────────┐
│ Settings                │
│                         │
│ Appearance              │
│ Dark Mode      [====●]  │
│                         │
│ Physics                 │
│ Damping    ───●──────   │
│ Repulsion  ─────●────   │
│ Attraction ──●───────   │
│ Grouping   ────●─────   │
│ Filter Depth ──●─────   │
└─────────────────────────┘
```

## Acceptance Criteria

- [ ] Only one settings button visible (gear emoji ⚙️), no standalone theme toggle
- [ ] Clicking gear opens settings modal with "Dark Mode" toggle switch + physics sliders
- [ ] Theme toggle switch correctly reflects current theme state
- [ ] Toggling theme inside modal works (switches light/dark), modal stays open
- [ ] All control buttons (gear, zoom +/-, reset) use `--bg-primary` background with border, not green
- [ ] Hover state uses `--bg-secondary` on all control buttons
- [ ] Button text/emoji uses `--text-primary` for visibility against theme background
- [ ] Gear emoji stays static (no `^`/`v` flip) regardless of panel state
- [ ] Panel title reads "Settings" with "Appearance" and "Physics" section subheadings
- [ ] Mobile responsive behavior preserved (button sizing at 768px and 480px breakpoints)
- [ ] `aria-label` on gear button updated to "Open settings"
- [ ] Existing tests updated to reflect removed theme toggle button and new settings panel structure

## Key Files

| File | Changes |
|------|---------|
| `src/styles.css` | Button colors, remove theme-toggle selector, add toggle switch styles |
| `src/ui/managers/UIControlsManager.ts` | Remove theme toggle, gear emoji, static icon |
| `src/ui/managers/UISettingsManager.ts` | Add theme toggle section, new callback, section headings |
| `src/ui/UIManager.ts` | Mirror changes from extracted managers, wire callbacks |
| `src/GraphNetwork.ts` | Wire onToggleTheme to settings manager |
| `tests/unit/ui/UIManager.test.ts` | Update tests for removed theme button, new settings panel toggle |

## Institutional Learnings

- **CSS positioning:** UI overlays require `position: absolute` on the canvas to stay layered correctly (see `docs/solutions/ui-bugs/css-positioning-broke-ui-overlay-layer.md`)
- **Settings panel visibility:** Use CSS class `.is-open` not inline `style.display` — a past regression came from mixing approaches (see `docs/solutions/runtime-errors/god-object-decomposition-regression.md`)
- **Dual implementations:** Both `UIManager.ts` and the extracted managers (`UIControlsManager`, `UISettingsManager`) contain overlapping code. Changes must be applied to both until the monolith is fully decomposed.
