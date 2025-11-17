import { Node } from '../Node';
import { UIConfig, NodeData, UIElements } from '../types/index';
import { ThemeManager } from '../theming/ThemeManager';

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
    onConfigChange?: (key: string, value: unknown) => void;
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
 * Legend item representing a node type
 */
interface LegendItem {
    type: string;
    shape: 'circle' | 'rectangle' | 'square' | 'triangle';
    color: string;
    stroke?: string;
    strokeWidth?: string;
}

/**
 * Physics control configuration
 */
interface PhysicsControl {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    value: number;
    description: string;
}

/**
 * UIManager - Handles creation and management of all UI elements
 * Enhanced with full TypeScript support and comprehensive UI management
 */
export class UIManager {
    private readonly container: HTMLElement;
    private readonly config: UIConfig;
    private readonly callbacks: UICallbacks;

    // UI element references
    private titleElement: HTMLElement | null = null;
    private breadcrumbsElement: HTMLElement | null = null;
    private legendElement: HTMLElement | null = null;
    private controls: HTMLElement | null = null;
    private settingsPanel: HTMLElement | null = null;
    private mobileControls: HTMLElement | null = null;

    // Control button references
    private zoomInButton: HTMLButtonElement | null = null;
    private zoomOutButton: HTMLButtonElement | null = null;
    private resetButton: HTMLButtonElement | null = null;
    private themeToggle: HTMLButtonElement | null = null;
    private settingsToggle: HTMLButtonElement | null = null;

    // Settings state
    private settingsVisible: boolean = false;

    // Theme manager
    private themeManager: ThemeManager;

    /**
     * Create a new UIManager instance
     * @param container - DOM container element
     * @param config - UI configuration
     * @param callbacks - UI event callbacks
     * @param themeManager - Theme manager instance
     */
    constructor(
        container: HTMLElement,
        config: Partial<UIConfig> = {},
        callbacks: UICallbacks = {},
        themeManager: ThemeManager
    ) {
        this.container = container;
        this.themeManager = themeManager;
        this.config = {
            showControls: true,
            showLegend: true,
            showTitle: true,
            showBreadcrumbs: true,
            theme: 'dark',
            autoColor: true,
            title: 'Graph Network',
            ...config
        };
        this.callbacks = callbacks;
    }

    /**
     * Initialize all UI components
     */
    initialize(): void {
        this.createTitle();
        this.createBreadcrumbs();
        this.createLegend();
        this.createControls();
        this.createSettingsPanel();
    }

    /**
     * Safely set a class name on an element, avoiding readonly property issues
     * @param element - DOM element
     * @param className - CSS class name to set
     */
    private setElementClass(element: HTMLElement, className: string): void {
        try {
            element.className = className;
        } catch {
            // Fallback to classList if className is readonly
            element.classList.add(className);
        }
    }

    /**
     * Create title element
     */
    private createTitle(): void {
        if (!this.config.showTitle) return;

        this.titleElement = document.createElement('h2');
        this.setElementClass(this.titleElement, 'graph-network-title');
        this.titleElement.textContent = this.config.title;

        // Apply theme colors
        this.updateTitleTheme();

        this.container.appendChild(this.titleElement);
    }

    /**
     * Update title color based on current theme
     */
    private updateTitleTheme(): void {
        if (!this.titleElement) return;

        const foregroundColor = this.themeManager.getColor('foreground');
        if (foregroundColor) {
            this.titleElement.style.color = foregroundColor;
        }
    }

    /**
     * Update legend styling based on current theme
     */
    private updateLegendTheme(): void {
        if (!this.legendElement) return;

        const backgroundColor = this.themeManager.getColor('background');
        const foregroundColor = this.themeManager.getColor('foreground');
        const currentTheme = this.themeManager.getCurrentTheme();

        // Update legend background and shadow
        if (backgroundColor) {
            this.legendElement.style.backgroundColor = backgroundColor;

            // Add appropriate shadow based on theme
            if (currentTheme.name === 'dark' || currentTheme.name === 'default') {
                // Dark themes need light shadow
                this.legendElement.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.1)';
            } else {
                // Light themes use dark shadow
                this.legendElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }
        }

        // Update legend text colors
        if (foregroundColor) {
            const header = this.legendElement.querySelector('.graph-network-legend-header');
            if (header && header instanceof HTMLElement) {
                header.style.color = foregroundColor;
            }

            // Update toggle button color
            const toggleButton = this.legendElement.querySelector('.graph-network-legend-toggle');
            if (toggleButton && toggleButton instanceof HTMLElement) {
                toggleButton.style.color = foregroundColor;
                toggleButton.style.borderColor = foregroundColor;
            }

            // Update all legend item text
            const legendItems = this.legendElement.querySelectorAll(
                '.graph-network-legend-item span'
            );
            legendItems.forEach(item => {
                if (item instanceof HTMLElement) {
                    item.style.color = foregroundColor;
                }
            });
        }
    }

    /**
     * Create breadcrumbs navigation
     */
    private createBreadcrumbs(): void {
        if (!this.config.showBreadcrumbs) return;

        this.breadcrumbsElement = document.createElement('div');
        this.setElementClass(this.breadcrumbsElement, 'graph-network-breadcrumbs');
        this.container.appendChild(this.breadcrumbsElement);
    }

    /**
     * Generate legend items from unique node types
     * @param nodes - Array of nodes to analyze
     * @returns Array of legend items
     */
    private generateLegendItems<T extends NodeData>(nodes: Node<T>[]): LegendItem[] {
        const nodeTypes = new Set<string>();
        const typeInfo = new Map<string, LegendItem>();

        nodes.forEach(node => {
            const type = node.getType();
            if (type && !nodeTypes.has(type)) {
                nodeTypes.add(type);
                const nodeStyle = this.themeManager.getNodeStyle(type);
                typeInfo.set(type, {
                    type: type,
                    shape: node.getShape(),
                    color: this.getNodeTypeColor(type),
                    stroke: nodeStyle.stroke,
                    strokeWidth: nodeStyle.strokeWidth?.toString()
                });
            }
        });

        return Array.from(typeInfo.values());
    }

    /**
     * Get color for node type from current theme
     * @param type - Node type string
     * @returns CSS color value
     */
    private getNodeTypeColor(type: string): string {
        // Get the node style from theme manager
        const nodeStyle = this.themeManager.getNodeStyle(type);

        // Return the fill color from the style, or fallback to theme primary color
        if (nodeStyle.fill) {
            return nodeStyle.fill;
        }

        // Fallback to theme primary color or default
        return this.themeManager.getColor('primary') || '#666666';
    }

    /**
     * Create and update legend
     * @param nodes - Array of nodes to generate legend from
     */
    createLegend<T extends NodeData>(nodes: Node<T>[] = []): void {
        if (!this.config.showLegend) return;

        if (!this.legendElement) {
            this.legendElement = document.createElement('div');
            this.setElementClass(this.legendElement, 'graph-network-legend');

            const header = document.createElement('div');
            this.setElementClass(header, 'graph-network-legend-header');
            header.textContent = 'Node Types';

            const toggleButton = document.createElement('button');
            this.setElementClass(toggleButton, 'graph-network-legend-toggle');
            toggleButton.textContent = '−';
            toggleButton.addEventListener('click', () => this.toggleLegend());

            header.appendChild(toggleButton);
            this.legendElement.appendChild(header);

            const content = document.createElement('div');
            this.setElementClass(content, 'graph-network-legend-content');
            this.legendElement.appendChild(content);

            this.container.appendChild(this.legendElement);

            // Apply initial theme styling
            this.updateLegendTheme();
        }

        this.updateLegend(nodes);
    }

    /**
     * Update legend content with current nodes
     * @param nodes - Array of nodes to update legend with
     */
    updateLegend<T extends NodeData>(nodes: Node<T>[]): void {
        if (!this.legendElement) return;

        const content = this.legendElement.querySelector(
            '.graph-network-legend-content'
        ) as HTMLElement;
        if (!content) return;

        const legendItems = this.generateLegendItems(nodes);
        content.innerHTML = '';

        legendItems.forEach(item => {
            const legendItem = document.createElement('div');
            this.setElementClass(legendItem, 'graph-network-legend-item');

            const shape = document.createElement('div');
            this.setElementClass(
                shape,
                `graph-network-legend-shape graph-network-legend-${item.shape}`
            );
            shape.style.backgroundColor = item.color;

            // Apply border styling to match node stroke
            if (item.stroke) {
                const strokeWidth = item.strokeWidth ? `${item.strokeWidth}px` : '2px';
                shape.style.border = `${strokeWidth} solid ${item.stroke}`;
            } else {
                // Fallback border for better visibility when no stroke is defined
                const fallbackColor = this.themeManager.getColor('foreground') || '#666666';
                shape.style.border = `2px solid ${fallbackColor}`;
            }

            const label = document.createElement('span');
            label.textContent = item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            // Apply theme text color
            const foregroundColor = this.themeManager.getColor('foreground');
            if (foregroundColor) {
                label.style.color = foregroundColor;
            }

            legendItem.appendChild(shape);
            legendItem.appendChild(label);
            content.appendChild(legendItem);
        });
    }

    /**
     * Toggle legend visibility
     */
    private toggleLegend(): void {
        if (!this.legendElement) return;

        const toggleButton = this.legendElement.querySelector(
            '.graph-network-legend-toggle'
        ) as HTMLButtonElement;
        const isMinimized = this.legendElement.classList.contains('minimized');

        if (isMinimized) {
            this.legendElement.classList.remove('minimized');
            if (toggleButton) toggleButton.textContent = '−';
        } else {
            this.legendElement.classList.add('minimized');
            if (toggleButton) toggleButton.textContent = '+';
        }
    }

    /**
     * Create control buttons
     */
    private createControls(): void {
        if (!this.config.showControls) return;

        this.controls = document.createElement('div');
        this.setElementClass(this.controls, 'graph-network-controls');

        // Mobile zoom controls (hidden on desktop via CSS)
        this.mobileControls = document.createElement('div');
        this.setElementClass(this.mobileControls, 'graph-network-mobile-controls');

        // Create zoom buttons
        this.createZoomButtons();

        // Create utility buttons
        this.createUtilityButtons();

        this.controls.appendChild(this.mobileControls);
        if (this.themeToggle) {
            this.controls.appendChild(this.themeToggle);
        }
        if (this.settingsToggle) {
            this.controls.appendChild(this.settingsToggle);
        }
        this.container.appendChild(this.controls);
    }

    /**
     * Create zoom control buttons
     */
    private createZoomButtons(): void {
        if (!this.mobileControls) return;

        // Zoom in button
        this.zoomInButton = document.createElement('button');
        this.setElementClass(this.zoomInButton, 'graph-network-zoom-button graph-network-zoom-in');
        this.zoomInButton.textContent = '+';
        this.zoomInButton.setAttribute('aria-label', 'Zoom in');
        this.zoomInButton.addEventListener('click', () => {
            this.callbacks.onZoomIn?.();
        });

        // Zoom out button
        this.zoomOutButton = document.createElement('button');
        this.setElementClass(
            this.zoomOutButton,
            'graph-network-zoom-button graph-network-zoom-out'
        );
        this.zoomOutButton.textContent = '−';
        this.zoomOutButton.setAttribute('aria-label', 'Zoom out');
        this.zoomOutButton.addEventListener('click', () => {
            this.callbacks.onZoomOut?.();
        });

        // Reset view button
        this.resetButton = document.createElement('button');
        this.setElementClass(this.resetButton, 'graph-network-reset-view-button');
        this.resetButton.textContent = '⊙';
        this.resetButton.addEventListener('click', () => {
            this.callbacks.onResetView?.();
        });

        this.mobileControls.appendChild(this.zoomInButton);
        this.mobileControls.appendChild(this.zoomOutButton);
        this.mobileControls.appendChild(this.resetButton);
    }

    /**
     * Create utility buttons (theme, settings)
     */
    private createUtilityButtons(): void {
        // Theme toggle
        this.themeToggle = document.createElement('button');
        this.setElementClass(this.themeToggle, 'graph-network-theme-toggle');
        this.themeToggle.textContent = this.config.theme === 'light' ? '🌙' : '🌞';
        this.themeToggle.setAttribute('aria-label', 'Toggle theme');
        this.themeToggle.addEventListener('click', () => {
            this.callbacks.onToggleTheme?.();
        });

        // Settings toggle
        this.settingsToggle = document.createElement('button');
        this.setElementClass(this.settingsToggle, 'graph-network-settings-toggle');
        this.settingsToggle.textContent = '^';
        this.settingsToggle.addEventListener('click', () => this.toggleSettings());
    }

    /**
     * Create settings panel
     */
    private createSettingsPanel(): void {
        if (!this.config.showControls) return;

        this.settingsPanel = document.createElement('div');
        this.setElementClass(this.settingsPanel, 'graph-network-settings');

        const title = document.createElement('h3');
        title.textContent = 'Physics Settings';
        this.settingsPanel.appendChild(title);

        // Create physics control sliders
        this.createPhysicsControls();

        // Prevent settings panel from closing when clicked inside
        this.settingsPanel.addEventListener('click', e => {
            e.stopPropagation();
        });

        this.container.appendChild(this.settingsPanel);
    }

    /**
     * Create physics control sliders
     */
    private createPhysicsControls(): void {
        if (!this.settingsPanel) return;

        const controls: PhysicsControl[] = [
            {
                key: 'damping',
                label: 'Damping',
                min: 0,
                max: 20,
                step: 0.5,
                value: 10,
                description: 'Velocity decay factor'
            },
            {
                key: 'repulsionStrength',
                label: 'Repulsion',
                min: 0,
                max: 20,
                step: 0.5,
                value: 13,
                description: 'Node repulsion force'
            },
            {
                key: 'attractionStrength',
                label: 'Attraction',
                min: 0,
                max: 20,
                step: 0.1,
                value: 10,
                description: 'Link attraction force'
            },
            {
                key: 'groupingStrength',
                label: 'Grouping',
                min: 0,
                max: 20,
                step: 0.5,
                value: 10,
                description: 'Same-type grouping force'
            },
            {
                key: 'filterDepth',
                label: 'Filter Depth',
                min: 1,
                max: 5,
                step: 1,
                value: 1,
                description: 'Connection levels to show when filtering'
            }
        ];

        controls.forEach(control => {
            const controlDiv = document.createElement('div');
            this.setElementClass(controlDiv, 'graph-network-control');

            const label = document.createElement('label');
            label.textContent = control.label;

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = control.min.toString();
            slider.max = control.max.toString();
            slider.step = control.step.toString();
            slider.value = control.value.toString();

            const value = document.createElement('span');
            this.setElementClass(value, 'graph-network-control-value');
            value.textContent = control.value.toFixed(1);

            slider.addEventListener('input', e => {
                const target = e.target as HTMLInputElement;
                const userValue = parseFloat(target.value);
                const actualValue = this.convertUserValueToPhysics(control.key, userValue);
                value.textContent = userValue.toFixed(1);
                this.callbacks.onConfigChange?.(control.key, actualValue);
            });

            controlDiv.appendChild(label);
            controlDiv.appendChild(slider);
            controlDiv.appendChild(value);
            this.settingsPanel!.appendChild(controlDiv);
        });
    }

    /**
     * Toggle settings panel visibility
     */
    private toggleSettings(): void {
        if (!this.settingsPanel || !this.settingsToggle) return;

        this.settingsVisible = !this.settingsVisible;

        if (this.settingsVisible) {
            this.settingsPanel.classList.add('is-open');
        } else {
            this.settingsPanel.classList.remove('is-open');
        }

        this.settingsToggle.textContent = this.settingsVisible ? 'v' : '^';
    }

    /**
     * Close settings panel
     */
    closeSettings(): void {
        if (!this.settingsPanel || !this.settingsVisible) return;

        this.settingsVisible = false;
        this.settingsPanel.classList.remove('is-open');
        if (this.settingsToggle) {
            this.settingsToggle.textContent = '^';
        }
    }

    /**
     * Update theme toggle button appearance
     * @param theme - Current theme
     */
    updateThemeToggle(theme: 'light' | 'dark'): void {
        if (this.themeToggle) {
            this.themeToggle.textContent = theme === 'light' ? '🌙' : '🌞';
        }
    }

    /**
     * Render breadcrumbs navigation
     * @param path - Array of breadcrumb items
     */
    renderBreadcrumbs(path: BreadcrumbItem[]): void {
        if (!this.breadcrumbsElement) return;

        this.breadcrumbsElement.innerHTML = '';

        path.forEach((item, index) => {
            if (index > 0) {
                const separator = document.createElement('span');
                this.setElementClass(separator, 'graph-network-breadcrumb-separator');
                separator.textContent = ' > ';
                this.breadcrumbsElement!.appendChild(separator);
            }

            const breadcrumb = document.createElement('span');
            this.setElementClass(breadcrumb, 'graph-network-breadcrumb');
            if (index === path.length - 1) {
                breadcrumb.classList.add('active');
            }
            breadcrumb.textContent = item.name;
            if (item.action) {
                breadcrumb.setAttribute('data-action', item.action);
            }
            breadcrumb.addEventListener('click', () => {
                if (item.action) {
                    this.callbacks.onBreadcrumbClick?.(item.action);
                }
            });
            this.breadcrumbsElement!.appendChild(breadcrumb);
        });
    }

    /**
     * Convert user-friendly 0-20 scale values to actual physics values
     * @param key - Physics parameter key
     * @param userValue - User-facing value (0-20 scale)
     * @returns Actual physics value
     */
    private convertUserValueToPhysics(key: string, userValue: number): number {
        const numValue = parseFloat(userValue.toString());

        switch (key) {
            case 'damping':
                if (numValue === 0) {
                    return 1.0;
                } else {
                    const t = numValue / 20;
                    return Math.exp(Math.log(1.0) * (1 - t) + Math.log(0.35) * t);
                }
            case 'repulsionStrength':
                return numValue * 500;
            case 'attractionStrength':
                return numValue / 10000;
            case 'groupingStrength':
                return numValue / 10000;
            case 'filterDepth':
                return parseInt(numValue.toString()); // No conversion needed, use raw value
            default:
                return numValue;
        }
    }

    /**
     * Update configuration
     * @param newConfig - Partial configuration to merge
     */
    updateConfig(newConfig: Partial<UIConfig>): void {
        Object.assign(this.config, newConfig);
    }

    /**
     * Get all UI elements for external access
     * @returns UI elements object or null if not initialized
     */
    getUIElements(): UIElements | null {
        return {
            container: this.container,
            titleElement: this.titleElement || undefined,
            legendElement: this.legendElement || undefined,
            controls: this.controls || undefined,
            settingsPanel: this.settingsPanel || undefined
        };
    }

    /**
     * Get current UI configuration
     * @returns Copy of current UI configuration
     */
    getConfig(): UIConfig {
        return { ...this.config };
    }

    /**
     * Check if settings panel is currently visible
     * @returns True if settings panel is open
     */
    isSettingsVisible(): boolean {
        return this.settingsVisible;
    }

    /**
     * Enable or disable specific UI elements
     * @param element - Element type to toggle
     * @param enabled - Whether to enable the element
     */
    setElementEnabled(element: 'zoom' | 'reset' | 'theme' | 'settings', enabled: boolean): void {
        switch (element) {
            case 'zoom':
                if (this.zoomInButton) this.zoomInButton.disabled = !enabled;
                if (this.zoomOutButton) this.zoomOutButton.disabled = !enabled;
                break;
            case 'reset':
                if (this.resetButton) this.resetButton.disabled = !enabled;
                break;
            case 'theme':
                if (this.themeToggle) this.themeToggle.disabled = !enabled;
                break;
            case 'settings':
                if (this.settingsToggle) this.settingsToggle.disabled = !enabled;
                break;
        }
    }

    /**
     * Update the title text
     * @param title - New title text
     */
    updateTitle(title: string): void {
        if (this.titleElement) {
            this.titleElement.textContent = title;
        }
        this.config.title = title;
    }

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
    } {
        return {
            config: this.config,
            settingsVisible: this.settingsVisible,
            elementCounts: {
                title: this.titleElement !== null,
                breadcrumbs: this.breadcrumbsElement !== null,
                legend: this.legendElement !== null,
                controls: this.controls !== null,
                settingsPanel: this.settingsPanel !== null
            },
            type: 'UIManager',
            version: '2.0.0'
        };
    }

    /**
     * Update all UI theme colors when theme changes
     */
    updateThemeColors<T extends NodeData>(nodes?: Node<T>[]): void {
        this.updateTitleTheme();
        this.updateLegendTheme();

        // Regenerate legend with new theme colors
        if (nodes && this.legendElement) {
            this.updateLegend(nodes);
        }
    }

    /**
     * Clean up UI elements and remove from DOM
     */
    destroy(): void {
        // Remove all created elements
        [
            this.titleElement,
            this.breadcrumbsElement,
            this.legendElement,
            this.controls,
            this.settingsPanel
        ].forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });

        // Clear all references
        this.titleElement = null;
        this.breadcrumbsElement = null;
        this.legendElement = null;
        this.controls = null;
        this.settingsPanel = null;
        this.mobileControls = null;
        this.zoomInButton = null;
        this.zoomOutButton = null;
        this.resetButton = null;
        this.themeToggle = null;
        this.settingsToggle = null;
    }

    /**
     * Create a string representation of the UI manager
     * @returns String representation
     */
    toString(): string {
        return `UIManager(container: ${this.container.id || 'unnamed'}, theme: ${this.config.theme})`;
    }
}
