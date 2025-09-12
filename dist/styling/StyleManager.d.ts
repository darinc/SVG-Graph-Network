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
import { IStyleManager, NodeStyles, EdgeStyles, StyleObject, VisualState, ElementSelector, StyleEvent } from '../types/styling';
/**
 * Style change callback type
 */
export type StyleChangeCallback = (event: StyleEvent) => void;
/**
 * StyleManager handles all dynamic styling operations
 */
export declare class StyleManager implements IStyleManager {
    private nodeStyles;
    private edgeStyles;
    private nodeStates;
    private edgeStates;
    private readonly onStyleChange?;
    private styleSheet?;
    private cssRuleIndex;
    /**
     * Create a new StyleManager
     * @param onStyleChange - Callback for style changes
     */
    constructor(onStyleChange?: StyleChangeCallback);
    /**
     * Set style for a specific node
     */
    setNodeStyle(nodeId: string, styles: NodeStyles): void;
    /**
     * Set style for a specific edge
     */
    setEdgeStyle(edgeId: string, styles: EdgeStyles): void;
    /**
     * Set visual state for a node
     */
    setNodeState(nodeId: string, state: VisualState): void;
    /**
     * Set visual state for an edge
     */
    setEdgeState(edgeId: string, state: VisualState): void;
    /**
     * Update styles for multiple elements
     */
    updateStyles(elements: ElementSelector, styles: StyleObject): void;
    /**
     * Reset styles to defaults
     */
    resetStyle(elements?: ElementSelector): void;
    /**
     * Get current style for a node
     */
    getNodeStyle(nodeId: string): NodeStyles | null;
    /**
     * Get current style for an edge
     */
    getEdgeStyle(edgeId: string): EdgeStyles | null;
    /**
     * Get current visual state for a node
     */
    getNodeState(nodeId: string): VisualState;
    /**
     * Get current visual state for an edge
     */
    getEdgeState(edgeId: string): VisualState;
    /**
     * Clear all styles
     */
    clearStyles(): void;
    /**
     * Register an SVG element for styling
     */
    registerElement(elementId: string, type: 'node' | 'edge', element: SVGElement): void;
    /**
     * Unregister an SVG element
     */
    unregisterElement(elementId: string, type: 'node' | 'edge'): void;
    /**
     * Apply theme-specific styles
     */
    applyTheme(theme: 'light' | 'dark'): void;
    /**
     * Get or create node style storage
     */
    private getOrCreateNodeStyle;
    /**
     * Get or create edge style storage
     */
    private getOrCreateEdgeStyle;
    /**
     * Update computed style based on base style and current state
     */
    private updateComputedStyle;
    /**
     * Apply computed style to DOM element
     */
    private applyStyleToElement;
    /**
     * Update element CSS class for state
     */
    private updateElementClass;
    /**
     * Resolve element selector to specific elements
     */
    private resolveElementSelector;
    /**
     * Initialize dynamic CSS stylesheet
     */
    private initializeStyleSheet;
    /**
     * Clear all dynamic styles from stylesheet
     */
    private clearAllDynamicStyles;
    /**
     * Clear style for specific element
     */
    private clearElementStyle;
    /**
     * Get theme-specific default styles
     */
    private getThemeStyles;
    /**
     * Emit style change event
     */
    private emitStyleChange;
}
//# sourceMappingURL=StyleManager.d.ts.map