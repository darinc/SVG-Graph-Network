/**
 * UIControlsManager - Manages control buttons and user interactions
 *
 * Extracted from UIManager to reduce God Object anti-pattern.
 * Handles zoom controls, theme toggle, and utility buttons.
 */

/**
 * Configuration for controls management
 */
export interface UIControlsConfig {
    showControls: boolean;
    theme: 'light' | 'dark';
}

/**
 * Callback functions for control interactions
 */
export interface UIControlsCallbacks {
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onResetView?: () => void;
    onToggleTheme?: () => void;
    onToggleSettings?: () => void;
}

/**
 * UIControlsManager handles all control buttons and interactions
 *
 * Responsibilities:
 * - Create and manage zoom control buttons
 * - Handle theme toggle button
 * - Manage settings toggle button
 * - Handle mobile-specific controls
 * - Enable/disable button states
 * - Coordinate button callbacks
 */
export class UIControlsManager {
    private controlsContainer: HTMLElement | null = null;
    private mobileControls: HTMLElement | null = null;

    // Button references
    private zoomInButton: HTMLButtonElement | null = null;
    private zoomOutButton: HTMLButtonElement | null = null;
    private resetButton: HTMLButtonElement | null = null;
    private themeToggle: HTMLButtonElement | null = null;
    private settingsToggle: HTMLButtonElement | null = null;

    private readonly container: HTMLElement;
    private config: UIControlsConfig;
    private readonly callbacks: UIControlsCallbacks;

    constructor(
        container: HTMLElement,
        config: UIControlsConfig,
        callbacks: UIControlsCallbacks = {}
    ) {
        this.container = container;
        this.config = { ...config };
        this.callbacks = callbacks;
    }

    /**
     * Initialize all control elements
     */
    initialize(): void {
        if (!this.config.showControls || this.controlsContainer) return;

        this.createControlsStructure();
        this.createZoomButtons();
        this.createUtilityButtons();
        this.assembleControls();
    }

    /**
     * Create main controls structure
     * @private
     */
    private createControlsStructure(): void {
        this.controlsContainer = document.createElement('div');
        this.setElementClass(this.controlsContainer, 'graph-network-controls');

        // Mobile zoom controls (hidden on desktop via CSS)
        this.mobileControls = document.createElement('div');
        this.setElementClass(this.mobileControls, 'graph-network-mobile-controls');
    }

    /**
     * Safely set element class name
     * @private
     */
    private setElementClass(element: HTMLElement, className: string): void {
        try {
            element.className = className;
        } catch {
            element.classList.add(className);
        }
    }

    /**
     * Create zoom control buttons
     * @private
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
        this.resetButton.setAttribute('aria-label', 'Reset view');
        this.resetButton.addEventListener('click', () => {
            this.callbacks.onResetView?.();
        });

        // Add to mobile controls
        this.mobileControls.appendChild(this.zoomInButton);
        this.mobileControls.appendChild(this.zoomOutButton);
        this.mobileControls.appendChild(this.resetButton);
    }

    /**
     * Create utility buttons (theme, settings)
     * @private
     */
    private createUtilityButtons(): void {
        // Theme toggle
        this.themeToggle = document.createElement('button');
        this.setElementClass(this.themeToggle, 'graph-network-theme-toggle');
        this.updateThemeToggleAppearance();
        this.themeToggle.setAttribute('aria-label', 'Toggle theme');
        this.themeToggle.addEventListener('click', () => {
            this.callbacks.onToggleTheme?.();
        });

        // Settings toggle
        this.settingsToggle = document.createElement('button');
        this.setElementClass(this.settingsToggle, 'graph-network-settings-toggle');
        this.settingsToggle.textContent = '^';
        this.settingsToggle.setAttribute('aria-label', 'Toggle settings');
        this.settingsToggle.addEventListener('click', () => {
            this.callbacks.onToggleSettings?.();
        });
    }

    /**
     * Assemble all controls into main container
     * @private
     */
    private assembleControls(): void {
        if (!this.controlsContainer) return;

        if (this.mobileControls) {
            this.controlsContainer.appendChild(this.mobileControls);
        }
        if (this.themeToggle) {
            this.controlsContainer.appendChild(this.themeToggle);
        }
        if (this.settingsToggle) {
            this.controlsContainer.appendChild(this.settingsToggle);
        }

        this.container.appendChild(this.controlsContainer);
    }

    /**
     * Update theme toggle button appearance
     * @private
     */
    private updateThemeToggleAppearance(): void {
        if (!this.themeToggle) return;
        this.themeToggle.textContent = this.config.theme === 'light' ? '🌙' : '🌞';
    }

    /**
     * Update theme toggle appearance
     */
    updateThemeToggle(theme: 'light' | 'dark'): void {
        this.config.theme = theme;
        this.updateThemeToggleAppearance();
    }

    /**
     * Update settings toggle state
     */
    updateSettingsToggle(isOpen: boolean): void {
        if (this.settingsToggle) {
            this.settingsToggle.textContent = isOpen ? 'v' : '^';
        }
    }

    /**
     * Enable or disable specific controls
     */
    setControlEnabled(control: 'zoom' | 'reset' | 'theme' | 'settings', enabled: boolean): void {
        switch (control) {
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
     * Check if a specific control is enabled
     */
    isControlEnabled(control: 'zoom' | 'reset' | 'theme' | 'settings'): boolean {
        switch (control) {
            case 'zoom':
                return !(this.zoomInButton?.disabled || this.zoomOutButton?.disabled);
            case 'reset':
                return !this.resetButton?.disabled;
            case 'theme':
                return !this.themeToggle?.disabled;
            case 'settings':
                return !this.settingsToggle?.disabled;
            default:
                return false;
        }
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<UIControlsConfig>): void {
        const prevShowControls = this.config.showControls;
        Object.assign(this.config, newConfig);

        // Handle visibility changes
        if (!prevShowControls && this.config.showControls && !this.controlsContainer) {
            this.initialize();
        } else if (prevShowControls && !this.config.showControls && this.controlsContainer) {
            this.destroy();
        }

        // Update theme toggle if theme changed
        if (newConfig.theme !== undefined) {
            this.updateThemeToggleAppearance();
        }
    }

    /**
     * Get current controls container element
     */
    getControlsElement(): HTMLElement | null {
        return this.controlsContainer;
    }

    /**
     * Get specific button element
     */
    getButton(
        type: 'zoomIn' | 'zoomOut' | 'reset' | 'theme' | 'settings'
    ): HTMLButtonElement | null {
        switch (type) {
            case 'zoomIn':
                return this.zoomInButton;
            case 'zoomOut':
                return this.zoomOutButton;
            case 'reset':
                return this.resetButton;
            case 'theme':
                return this.themeToggle;
            case 'settings':
                return this.settingsToggle;
            default:
                return null;
        }
    }

    /**
     * Get current configuration
     */
    getConfig(): UIControlsConfig {
        return { ...this.config };
    }

    /**
     * Check if controls are currently visible
     */
    isVisible(): boolean {
        return this.controlsContainer !== null && this.config.showControls;
    }

    /**
     * Get count of available controls
     */
    getControlCount(): number {
        let count = 0;
        if (this.zoomInButton) count++;
        if (this.zoomOutButton) count++;
        if (this.resetButton) count++;
        if (this.themeToggle) count++;
        if (this.settingsToggle) count++;
        return count;
    }

    /**
     * Clean up all control elements
     */
    destroy(): void {
        if (this.controlsContainer && this.controlsContainer.parentNode) {
            this.controlsContainer.parentNode.removeChild(this.controlsContainer);
        }

        // Clear all references
        this.controlsContainer = null;
        this.mobileControls = null;
        this.zoomInButton = null;
        this.zoomOutButton = null;
        this.resetButton = null;
        this.themeToggle = null;
        this.settingsToggle = null;
    }

    /**
     * Get debugging information
     */
    getDebugInfo(): {
        config: UIControlsConfig;
        hasContainer: boolean;
        controlCount: number;
        enabledControls: {
            zoom: boolean;
            reset: boolean;
            theme: boolean;
            settings: boolean;
        };
        isAttached: boolean;
    } {
        return {
            config: this.getConfig(),
            hasContainer: this.controlsContainer !== null,
            controlCount: this.getControlCount(),
            enabledControls: {
                zoom: this.isControlEnabled('zoom'),
                reset: this.isControlEnabled('reset'),
                theme: this.isControlEnabled('theme'),
                settings: this.isControlEnabled('settings')
            },
            isAttached: this.controlsContainer?.parentNode !== null
        };
    }
}
