/**
 * StyleManager - Handles dynamic styling and visual state management
 * 
 * Provides centralized style management with support for:
 * - Dynamic style application and updates
 * - Visual state management (normal, hover, active, etc.)
 * - CSS class management
 * - Style inheritance and cascading
 * - Performance-optimized DOM updates
 */

import { 
    IStyleManager, 
    NodeStyles, 
    EdgeStyles, 
    StyleObject, 
    VisualState,
    ElementSelector,
    StyleEvent 
} from '../types/styling';

/**
 * Style change callback type
 */
export type StyleChangeCallback = (event: StyleEvent) => void;

/**
 * Internal style storage
 */
interface StoredStyle {
    base: StyleObject;
    state: Partial<Record<VisualState, StyleObject>>;
    computed: StyleObject;
    element?: SVGElement;
}

/**
 * StyleManager handles all dynamic styling operations
 */
export class StyleManager implements IStyleManager {
    private nodeStyles = new Map<string, StoredStyle>();
    private edgeStyles = new Map<string, StoredStyle>();
    private nodeStates = new Map<string, VisualState>();
    private edgeStates = new Map<string, VisualState>();
    private readonly onStyleChange?: StyleChangeCallback;
    private styleSheet?: CSSStyleSheet;
    private cssRuleIndex = 0;

    /**
     * Create a new StyleManager
     * @param onStyleChange - Callback for style changes
     */
    constructor(onStyleChange?: StyleChangeCallback) {
        this.onStyleChange = onStyleChange;
        this.initializeStyleSheet();
    }

    /**
     * Set style for a specific node
     */
    setNodeStyle(nodeId: string, styles: NodeStyles): void {
        const stored = this.getOrCreateNodeStyle(nodeId);
        stored.base = { ...stored.base, ...styles };
        this.updateComputedStyle(nodeId, 'node');
        this.applyStyleToElement(nodeId, 'node');
        this.emitStyleChange([nodeId], 'node', styles);
    }

    /**
     * Set style for a specific edge
     */
    setEdgeStyle(edgeId: string, styles: EdgeStyles): void {
        const stored = this.getOrCreateEdgeStyle(edgeId);
        stored.base = { ...stored.base, ...styles };
        this.updateComputedStyle(edgeId, 'edge');
        this.applyStyleToElement(edgeId, 'edge');
        this.emitStyleChange([edgeId], 'edge', styles);
    }

    /**
     * Set visual state for a node
     */
    setNodeState(nodeId: string, state: VisualState): void {
        const oldState = this.nodeStates.get(nodeId) || 'normal';
        if (oldState === state) return;

        this.nodeStates.set(nodeId, state);
        this.updateComputedStyle(nodeId, 'node');
        this.applyStyleToElement(nodeId, 'node');
        this.updateElementClass(nodeId, 'node', state);
    }

    /**
     * Set visual state for an edge
     */
    setEdgeState(edgeId: string, state: VisualState): void {
        const oldState = this.edgeStates.get(edgeId) || 'normal';
        if (oldState === state) return;

        this.edgeStates.set(edgeId, state);
        this.updateComputedStyle(edgeId, 'edge');
        this.applyStyleToElement(edgeId, 'edge');
        this.updateElementClass(edgeId, 'edge', state);
    }

    /**
     * Update styles for multiple elements
     */
    updateStyles(elements: ElementSelector, styles: StyleObject): void {
        const targets = this.resolveElementSelector(elements);
        const updatedElements: string[] = [];

        for (const { id, type } of targets) {
            if (type === 'node') {
                this.setNodeStyle(id, styles as NodeStyles);
            } else {
                this.setEdgeStyle(id, styles as EdgeStyles);
            }
            updatedElements.push(id);
        }

        if (updatedElements.length > 0) {
            this.emitStyleChange(updatedElements, targets[0]?.type || 'node', styles);
        }
    }

    /**
     * Reset styles to defaults
     */
    resetStyle(elements?: ElementSelector): void {
        if (!elements) {
            // Reset all styles
            this.nodeStyles.clear();
            this.edgeStyles.clear();
            this.nodeStates.clear();
            this.edgeStates.clear();
            this.clearAllDynamicStyles();
            return;
        }

        const targets = this.resolveElementSelector(elements);
        
        for (const { id, type } of targets) {
            if (type === 'node') {
                this.nodeStyles.delete(id);
                this.nodeStates.set(id, 'normal');
            } else {
                this.edgeStyles.delete(id);
                this.edgeStates.set(id, 'normal');
            }
            this.clearElementStyle(id, type);
        }
    }

    /**
     * Get current style for a node
     */
    getNodeStyle(nodeId: string): NodeStyles | null {
        const stored = this.nodeStyles.get(nodeId);
        return stored ? { ...stored.computed } as NodeStyles : null;
    }

    /**
     * Get current style for an edge
     */
    getEdgeStyle(edgeId: string): EdgeStyles | null {
        const stored = this.edgeStyles.get(edgeId);
        return stored ? { ...stored.computed } as EdgeStyles : null;
    }

    /**
     * Get current visual state for a node
     */
    getNodeState(nodeId: string): VisualState {
        return this.nodeStates.get(nodeId) || 'normal';
    }

    /**
     * Get current visual state for an edge
     */
    getEdgeState(edgeId: string): VisualState {
        return this.edgeStates.get(edgeId) || 'normal';
    }

    /**
     * Clear all styles
     */
    clearStyles(): void {
        this.resetStyle();
    }

    /**
     * Register an SVG element for styling
     */
    registerElement(elementId: string, type: 'node' | 'edge', element: SVGElement): void {
        if (type === 'node') {
            const stored = this.getOrCreateNodeStyle(elementId);
            stored.element = element;
        } else {
            const stored = this.getOrCreateEdgeStyle(elementId);
            stored.element = element;
        }
    }

    /**
     * Unregister an SVG element
     */
    unregisterElement(elementId: string, type: 'node' | 'edge'): void {
        if (type === 'node') {
            const stored = this.nodeStyles.get(elementId);
            if (stored) {
                stored.element = undefined;
            }
        } else {
            const stored = this.edgeStyles.get(elementId);
            if (stored) {
                stored.element = undefined;
            }
        }
    }

    /**
     * Apply theme-specific styles
     */
    applyTheme(theme: 'light' | 'dark'): void {
        const themeStyles = this.getThemeStyles(theme);
        
        // Apply theme to all registered elements
        this.nodeStyles.forEach((stored, nodeId) => {
            if (stored.element) {
                Object.assign(stored.base, themeStyles.node);
                this.updateComputedStyle(nodeId, 'node');
                this.applyStyleToElement(nodeId, 'node');
            }
        });

        this.edgeStyles.forEach((stored, edgeId) => {
            if (stored.element) {
                Object.assign(stored.base, themeStyles.edge);
                this.updateComputedStyle(edgeId, 'edge');
                this.applyStyleToElement(edgeId, 'edge');
            }
        });
    }

    /**
     * Get or create node style storage
     */
    private getOrCreateNodeStyle(nodeId: string): StoredStyle {
        if (!this.nodeStyles.has(nodeId)) {
            this.nodeStyles.set(nodeId, {
                base: {},
                state: {},
                computed: {}
            });
        }
        return this.nodeStyles.get(nodeId)!;
    }

    /**
     * Get or create edge style storage
     */
    private getOrCreateEdgeStyle(edgeId: string): StoredStyle {
        if (!this.edgeStyles.has(edgeId)) {
            this.edgeStyles.set(edgeId, {
                base: {},
                state: {},
                computed: {}
            });
        }
        return this.edgeStyles.get(edgeId)!;
    }

    /**
     * Update computed style based on base style and current state
     */
    private updateComputedStyle(elementId: string, type: 'node' | 'edge'): void {
        const stored = type === 'node' 
            ? this.nodeStyles.get(elementId)
            : this.edgeStyles.get(elementId);
        
        if (!stored) return;

        const currentState = type === 'node' 
            ? this.getNodeState(elementId)
            : this.getEdgeState(elementId);

        // Combine base styles with state-specific styles
        stored.computed = {
            ...stored.base,
            ...(stored.state[currentState] || {})
        };
    }

    /**
     * Apply computed style to DOM element
     */
    private applyStyleToElement(elementId: string, type: 'node' | 'edge'): void {
        const stored = type === 'node' 
            ? this.nodeStyles.get(elementId)
            : this.edgeStyles.get(elementId);
        
        if (!stored?.element) return;

        const element = stored.element;
        const styles = stored.computed;

        // Apply common styles
        if (styles.fill) element.setAttribute('fill', styles.fill);
        if (styles.stroke) element.setAttribute('stroke', styles.stroke);
        if (styles.strokeWidth !== undefined) element.setAttribute('stroke-width', String(styles.strokeWidth));
        if (styles.opacity !== undefined) element.setAttribute('opacity', String(styles.opacity));
        if (styles.strokeDasharray) element.setAttribute('stroke-dasharray', styles.strokeDasharray);
        if (styles.filter) element.setAttribute('filter', styles.filter);

        // Apply node-specific styles
        if (type === 'node' && styles.size !== undefined) {
            if (element.tagName === 'circle') {
                element.setAttribute('r', String(styles.size / 2));
            } else if (element.tagName === 'rect') {
                element.setAttribute('width', String(styles.size));
                element.setAttribute('height', String(styles.size));
                element.setAttribute('x', String(-styles.size / 2));
                element.setAttribute('y', String(-styles.size / 2));
            }
        }

        // Apply edge-specific styles
        if (type === 'edge' && styles.markerEnd) {
            element.setAttribute('marker-end', styles.markerEnd);
        }

        // Apply CSS classes
        if (styles.className) {
            element.setAttribute('class', styles.className);
        }
    }

    /**
     * Update element CSS class for state
     */
    private updateElementClass(elementId: string, type: 'node' | 'edge', state: VisualState): void {
        const stored = type === 'node' 
            ? this.nodeStyles.get(elementId)
            : this.edgeStyles.get(elementId);
        
        if (!stored?.element) return;

        const element = stored.element;
        const baseClass = type === 'node' ? 'graph-node' : 'graph-edge';
        const stateClass = `${baseClass}--${state}`;
        
        // Remove all state classes and add current one
        element.className.baseVal = element.className.baseVal
            .replace(/\bgraph-(node|edge)--\w+\b/g, '')
            .trim();
            
        element.classList.add(baseClass, stateClass);
        
        // Add custom class if specified
        if (stored.computed.className) {
            element.classList.add(stored.computed.className);
        }
    }

    /**
     * Resolve element selector to specific elements
     */
    private resolveElementSelector(selector: ElementSelector): Array<{id: string, type: 'node' | 'edge'}> {
        const results: Array<{id: string, type: 'node' | 'edge'}> = [];

        if (typeof selector === 'string') {
            if (selector === 'all') {
                // All nodes and edges
                this.nodeStyles.forEach((_, id) => results.push({id, type: 'node'}));
                this.edgeStyles.forEach((_, id) => results.push({id, type: 'edge'}));
            } else if (selector === 'selected') {
                // This would need integration with SelectionManager
                // For now, return empty array
            } else if (selector === 'highlighted') {
                // This would need integration with HighlightManager  
                // For now, return empty array
            } else {
                // Single element ID - check if it's node or edge
                if (this.nodeStyles.has(selector)) {
                    results.push({id: selector, type: 'node'});
                }
                if (this.edgeStyles.has(selector)) {
                    results.push({id: selector, type: 'edge'});
                }
            }
        } else if (Array.isArray(selector)) {
            // Array of IDs
            for (const id of selector) {
                if (this.nodeStyles.has(id)) {
                    results.push({id, type: 'node'});
                }
                if (this.edgeStyles.has(id)) {
                    results.push({id, type: 'edge'});
                }
            }
        }

        return results;
    }

    /**
     * Initialize dynamic CSS stylesheet
     */
    private initializeStyleSheet(): void {
        // Create a dynamic stylesheet for state-based styling
        const style = document.createElement('style');
        style.id = 'graph-dynamic-styles';
        document.head.appendChild(style);
        this.styleSheet = style.sheet as CSSStyleSheet;
    }

    /**
     * Clear all dynamic styles from stylesheet
     */
    private clearAllDynamicStyles(): void {
        if (this.styleSheet) {
            // Clear all rules
            while (this.styleSheet.cssRules.length > 0) {
                this.styleSheet.deleteRule(0);
            }
            this.cssRuleIndex = 0;
        }
    }

    /**
     * Clear style for specific element
     */
    private clearElementStyle(elementId: string, type: 'node' | 'edge'): void {
        const stored = type === 'node' 
            ? this.nodeStyles.get(elementId)
            : this.edgeStyles.get(elementId);
        
        if (!stored?.element) return;

        const element = stored.element;
        
        // Remove all custom attributes
        ['fill', 'stroke', 'stroke-width', 'opacity', 'stroke-dasharray', 'filter', 'marker-end'].forEach(attr => {
            element.removeAttribute(attr);
        });
        
        // Reset classes
        const baseClass = type === 'node' ? 'graph-node' : 'graph-edge';
        element.className.baseVal = baseClass;
    }

    /**
     * Get theme-specific default styles
     */
    private getThemeStyles(theme: 'light' | 'dark'): {node: NodeStyles, edge: EdgeStyles} {
        if (theme === 'dark') {
            return {
                node: {
                    fill: '#64748b',
                    stroke: '#94a3b8',
                    strokeWidth: 1
                },
                edge: {
                    stroke: '#475569',
                    strokeWidth: 1
                }
            };
        } else {
            return {
                node: {
                    fill: '#e2e8f0',
                    stroke: '#64748b',
                    strokeWidth: 1
                },
                edge: {
                    stroke: '#94a3b8',
                    strokeWidth: 1
                }
            };
        }
    }

    /**
     * Emit style change event
     */
    private emitStyleChange(elements: string[], elementType: 'node' | 'edge', styles: StyleObject): void {
        if (!this.onStyleChange) return;

        const event: StyleEvent = {
            type: 'styleChanged',
            elements,
            elementType,
            styles,
            timestamp: Date.now()
        };

        // Use a small delay to allow for batching
        if (typeof setTimeout !== 'undefined') {
            setTimeout(() => this.onStyleChange!(event), 0);
        } else {
            // For testing environment without setTimeout
            this.onStyleChange!(event);
        }
    }
}