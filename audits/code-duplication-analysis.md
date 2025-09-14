# Code Duplication Analysis Report

**Project**: SVG Graph Network Library  
**Analysis Date**: 2025-09-13  
**Files Analyzed**: 17 source files (TypeScript/JavaScript)  
**Overall Duplication Score**: 6.5/10 (Moderate)

## Executive Summary

The SVG Graph Network project demonstrates good architectural separation but contains several areas of code duplication that could benefit from refactoring. The duplication primarily stems from similar UI patterns, SVG element creation, and theme configuration across different components.

## Key Findings

### 1. EXACT DUPLICATES

#### A. `setElementClass` Utility Function
- **Location**: `src/ui/UIManager.ts:128` and `src/GraphNetworkLegacy.js:21`
- **Duplication**: 100% identical function implementation
- **Lines**: 5 lines each, 10 total
- **Importance**: 8/10

```typescript
// UIManager.ts
private setElementClass(element: HTMLElement, className: string): void {
    try {
        element.className = className;
    } catch (e) {
        console.warn('Failed to set element class:', className, e);
    }
}

// GraphNetworkLegacy.js  
setElementClass(element, className) {
    try {
        element.className = className;
    } catch (e) {
        console.warn('Failed to set element class:', className, e);
    }
}
```

**Remediation**:
```typescript
// Create src/utils/DOMUtils.ts
export class DOMUtils {
    static setElementClass(element: HTMLElement, className: string): void {
        try {
            element.className = className;
        } catch (e) {
            console.warn('Failed to set element class:', className, e);
        }
    }
}

// Usage in both files:
import { DOMUtils } from '../utils/DOMUtils';
DOMUtils.setElementClass(element, className);
```

**Refactoring Effort**: 2/10

---

#### B. SVG Element Creation Pattern
- **Location**: `src/rendering/SVGRenderer.ts` (18 occurrences) and `src/GraphNetworkLegacy.js` (15 occurrences)
- **Duplication**: ~90% identical patterns
- **Lines**: ~60 lines of duplication
- **Importance**: 9/10

```javascript
// Repeated 33 times across files:
document.createElementNS('http://www.w3.org/2000/svg', 'elementType')
```

**Remediation**:
```typescript
// Create src/utils/SVGElementFactory.ts
export class SVGElementFactory {
    private static readonly SVG_NS = 'http://www.w3.org/2000/svg';
    
    static createElement<K extends keyof SVGElementTagNameMap>(
        tagName: K
    ): SVGElementTagNameMap[K] {
        return document.createElementNS(this.SVG_NS, tagName);
    }
    
    static createGroup(): SVGGElement {
        return this.createElement('g');
    }
    
    static createLine(): SVGLineElement {
        return this.createElement('line');
    }
    
    static createRect(): SVGRectElement {
        return this.createElement('rect');
    }
    
    static createText(): SVGTextElement {
        return this.createElement('text');
    }
    
    static createCircle(): SVGCircleElement {
        return this.createElement('circle');
    }
    
    static createPolygon(): SVGPolygonElement {
        return this.createElement('polygon');
    }
}

// Usage:
const group = SVGElementFactory.createGroup();
const line = SVGElementFactory.createLine();
```

**Refactoring Effort**: 4/10

---

### 2. NEAR DUPLICATES

#### A. UI Button Creation Pattern
- **Location**: `src/ui/UIManager.ts:415-461` and `src/GraphNetworkLegacy.js:346-379`
- **Duplication**: ~85% similar structure
- **Lines**: ~30 lines similar patterns
- **Importance**: 7/10

```javascript
// Pattern repeated for each button type:
this.buttonName = document.createElement('button');
this.setElementClass(this.buttonName, 'class-name');
this.buttonName.textContent = 'Symbol';
this.buttonName.addEventListener('click', () => this.handlerMethod());
this.container.appendChild(this.buttonName);
```

**Remediation**:
```typescript
// Create src/utils/UIButtonFactory.ts
export interface ButtonConfig {
    className: string;
    textContent: string;
    onClick: () => void;
    title?: string;
}

export class UIButtonFactory {
    static createButton(config: ButtonConfig): HTMLButtonElement {
        const button = document.createElement('button');
        DOMUtils.setElementClass(button, config.className);
        button.textContent = config.textContent;
        if (config.title) button.title = config.title;
        button.addEventListener('click', config.onClick);
        return button;
    }
}

// Usage:
this.zoomInButton = UIButtonFactory.createButton({
    className: 'graph-network-zoom-button graph-network-zoom-in',
    textContent: '+',
    onClick: () => this.callbacks.onZoomIn?.(),
    title: 'Zoom In'
});
```

**Refactoring Effort**: 3/10

---

#### B. Legend Generation Logic
- **Location**: `src/ui/UIManager.ts:315-343` and `src/GraphNetworkLegacy.js:280-325`
- **Duplication**: ~80% similar logic
- **Lines**: ~45 lines with similar patterns
- **Importance**: 6/10

**Remediation**: Extract common legend generation logic into a shared `LegendGenerator` utility class.

**Refactoring Effort**: 5/10

---

### 3. STRUCTURAL DUPLICATES

#### A. Event Listener Setup Patterns
- **Location**: Multiple files
- **Duplication**: ~70% similar patterns
- **Importance**: 5/10

```javascript
// Repeated pattern:
element.addEventListener('click', () => {
    // validation
    // execution  
    // callback
});
```

**Remediation**:
```typescript
// Create src/utils/EventUtils.ts
export class EventUtils {
    static addClickHandler(
        element: HTMLElement, 
        handler: () => void, 
        options?: { validate?: () => boolean }
    ): void {
        element.addEventListener('click', () => {
            if (options?.validate && !options.validate()) return;
            handler();
        });
    }
}
```

**Refactoring Effort**: 3/10

---

#### B. Example File Initialization
- **Location**: `examples/basic.js:10-18` and `examples/advanced.js:10-21`
- **Duplication**: ~90% identical initialization pattern
- **Lines**: ~15 lines duplicated
- **Importance**: 4/10

```javascript
// Duplicated pattern:
document.addEventListener('DOMContentLoaded', () => {
    if (window.graph) {
        try {
            window.graph.destroy();
        } catch (e) {
            console.log('Previous graph instance cleanup skipped');
        }
    }
    // graph initialization...
});
```

**Remediation**:
```javascript
// Create examples/shared/graphInitializer.js
export function initializeGraph(containerId, options, setupCallbacks) {
    return new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', () => {
            // Common cleanup logic
            if (window.graph) {
                try {
                    window.graph.destroy();
                } catch (e) {
                    console.log('Previous graph instance cleanup skipped');
                }
            }
            
            const graph = new GraphNetwork(containerId, options);
            setupCallbacks?.(graph);
            window.graph = graph;
            resolve(graph);
        });
    });
}
```

**Refactoring Effort**: 2/10

---

### 4. DATA DUPLICATION

#### A. Theme Configuration Colors
- **Location**: `src/theming/ThemeManager.ts` (Lines 108, 118, 216, 223, 311, 321, 429, 439)
- **Duplication**: Background color values repeated across themes
- **Lines**: ~8 color definitions
- **Importance**: 3/10

```typescript
// Repeated values:
background: '#1a1a1a'  // Dark themes
background: '#ffffff'  // Light themes  
background: '#0f0f0f'  // Darker themes
```

**Remediation**:
```typescript
// Create src/theming/ColorPalette.ts
export const ColorPalette = {
    backgrounds: {
        darkPrimary: '#1a1a1a',
        darkSecondary: '#0f0f0f', 
        lightPrimary: '#ffffff',
        lightSecondary: '#f8fafc'
    },
    // ... other color categories
} as const;

// Usage in ThemeManager:
import { ColorPalette } from './ColorPalette';
// ...
background: ColorPalette.backgrounds.darkPrimary
```

**Refactoring Effort**: 2/10

---

#### B. Default Configuration Values
- **Location**: Multiple theme methods in `ThemeManager.ts`
- **Duplication**: Repeated default values (gridSize: 30, opacity: 0.1, etc.)
- **Importance**: 3/10

**Remediation**: Create shared constants object for default theme values.

**Refactoring Effort**: 2/10

---

## Refactoring Priority & Impact

### High Priority (8-10/10)
1. **`setElementClass` Function** - Immediate low-effort fix
2. **SVG Element Creation** - High impact on maintainability

### Medium Priority (5-7/10)  
3. **UI Button Creation Pattern** - Good architectural improvement
4. **Legend Generation Logic** - Reduces complexity

### Low Priority (1-4/10)
5. **Event Listener Patterns** - Nice-to-have utility
6. **Example Initialization** - Documentation/example improvement
7. **Theme Color Data** - Minor maintenance improvement
8. **Default Configuration** - Minor consistency improvement

## Proposed Utilities Module Structure

```
src/utils/
├── DOMUtils.ts          # DOM manipulation utilities
├── SVGElementFactory.ts # SVG element creation
├── UIButtonFactory.ts   # UI button creation
├── EventUtils.ts        # Event handling utilities
├── LegendGenerator.ts   # Legend generation logic
└── index.ts            # Barrel exports
```

## Implementation Estimate

- **Total Refactoring Effort**: 21/80 points (Moderate effort)
- **Time Estimate**: ~8-12 hours
- **Risk Level**: Low (utilities are self-contained)
- **Expected Duplication Reduction**: 6.5/10 → 3/10

## Benefits of Refactoring

1. **Maintainability**: Single source of truth for common patterns
2. **Type Safety**: Better TypeScript support for utilities
3. **Testing**: Easier to unit test isolated utility functions
4. **Consistency**: Enforced patterns across the codebase
5. **Bundle Size**: Potential reduction through better tree-shaking

## Recommended Next Steps

1. Start with `DOMUtils` and `SVGElementFactory` (high impact, low effort)
2. Implement `UIButtonFactory` to standardize UI patterns
3. Create shared constants for theme and configuration data
4. Extract legend generation logic
5. Update examples to use shared initialization

## Code Quality Score

- **Before Refactoring**: 6.5/10 (Moderate duplication)
- **After Refactoring**: 8.5/10 (Low duplication, high maintainability)

---

*Analysis completed using systematic pattern recognition across 17 source files, focusing on exact matches, structural similarities, and data repetition patterns.*