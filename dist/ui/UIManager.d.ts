import { Node } from '../Node';
import { UIConfig, NodeData, UIElements } from '../types/index';
/**
 * Callback function signatures for UI interactions
 */
export interface UICallbacks {
    /** Zoom in callback */
    onZoomIn?: () => void;
    /** Zoom out callback */
    onZoomOut?: () => void;
    /** Reset view callback */
    onResetView?: () => void;
    /** Toggle theme callback */
    onToggleTheme?: () => void;
    /** Configuration change callback */
    onConfigChange?: (key: string, value: any) => void;
    /** Breadcrumb navigation callback */
    onBreadcrumbClick?: (action: string) => void;
}
/**
 * Breadcrumb navigation item
 */
export interface BreadcrumbItem {
    name: string;
    action?: string;
}
/**
 * UIManager - Handles creation and management of all UI elements
 * Enhanced with full TypeScript support and comprehensive UI management
 */
export declare class UIManager {
    private readonly container;
    private readonly config;
    private readonly callbacks;
    private titleElement;
    private breadcrumbsElement;
    private legendElement;
    private controls;
    private settingsPanel;
    private mobileControls;
    private zoomInButton;
    private zoomOutButton;
    private resetButton;
    private themeToggle;
    private settingsToggle;
    private settingsVisible;
    /**
     * Create a new UIManager instance
     * @param container - DOM container element
     * @param config - UI configuration
     * @param callbacks - UI event callbacks
     */
    constructor(container: HTMLElement, config?: Partial<UIConfig>, callbacks?: UICallbacks);
    /**
     * Initialize all UI components
     */
    initialize(): void;
    /**
     * Safely set a class name on an element, avoiding readonly property issues
     * @param element - DOM element
     * @param className - CSS class name to set
     */
    private setElementClass;
    /**
     * Create title element
     */
    private createTitle;
    /**
     * Create breadcrumbs navigation
     */
    private createBreadcrumbs;
    /**
     * Generate legend items from unique node types
     * @param nodes - Array of nodes to analyze
     * @returns Array of legend items
     */
    private generateLegendItems;
    /**
     * Get color for node type
     * @param type - Node type string
     * @returns CSS color value
     */
    private getNodeTypeColor;
    /**
     * Create and update legend
     * @param nodes - Array of nodes to generate legend from
     */
    createLegend<T extends NodeData>(nodes?: Node<T>[]): void;
    /**
     * Update legend content with current nodes
     * @param nodes - Array of nodes to update legend with
     */
    updateLegend<T extends NodeData>(nodes: Node<T>[]): void;
    /**
     * Toggle legend visibility
     */
    private toggleLegend;
    /**
     * Create control buttons
     */
    private createControls;
    /**
     * Create zoom control buttons
     */
    private createZoomButtons;
    /**
     * Create utility buttons (theme, settings)
     */
    private createUtilityButtons;
    /**
     * Create settings panel
     */
    private createSettingsPanel;
    /**
     * Create physics control sliders
     */
    private createPhysicsControls;
    /**
     * Toggle settings panel visibility
     */
    private toggleSettings;
    /**
     * Close settings panel
     */
    closeSettings(): void;
    /**
     * Update theme toggle button appearance
     * @param theme - Current theme
     */
    updateThemeToggle(theme: 'light' | 'dark'): void;
    /**
     * Render breadcrumbs navigation
     * @param path - Array of breadcrumb items
     */
    renderBreadcrumbs(path: BreadcrumbItem[]): void;
    /**
     * Convert user-friendly 0-20 scale values to actual physics values
     * @param key - Physics parameter key
     * @param userValue - User-facing value (0-20 scale)
     * @returns Actual physics value
     */
    private convertUserValueToPhysics;
    /**
     * Update configuration
     * @param newConfig - Partial configuration to merge
     */
    updateConfig(newConfig: Partial<UIConfig>): void;
    /**
     * Get all UI elements for external access
     * @returns UI elements object or null if not initialized
     */
    getUIElements(): UIElements | null;
    /**
     * Get current UI configuration
     * @returns Copy of current UI configuration
     */
    getConfig(): UIConfig;
    /**
     * Check if settings panel is currently visible
     * @returns True if settings panel is open
     */
    isSettingsVisible(): boolean;
    /**
     * Enable or disable specific UI elements
     * @param element - Element type to toggle
     * @param enabled - Whether to enable the element
     */
    setElementEnabled(element: 'zoom' | 'reset' | 'theme' | 'settings', enabled: boolean): void;
    /**
     * Update the title text
     * @param title - New title text
     */
    updateTitle(title: string): void;
    /**
     * Convert this UI manager to a serializable object for debugging
     * @returns Object representation of the UI manager state
     */
    toObject(): {
        config: UIConfig;
        settingsVisible: boolean;
        elementCounts: {
            title: boolean;
            breadcrumbs: boolean;
            legend: boolean;
            controls: boolean;
            settingsPanel: boolean;
        };
        type: string;
        version: string;
    };
    /**
     * Clean up UI elements and remove from DOM
     */
    destroy(): void;
    /**
     * Create a string representation of the UI manager
     * @returns String representation
     */
    toString(): string;
}
//# sourceMappingURL=UIManager.d.ts.map