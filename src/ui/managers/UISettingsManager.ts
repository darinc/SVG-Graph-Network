/**
 * UISettingsManager - Manages settings panel and physics controls
 *
 * Extracted from UIManager to reduce God Object anti-pattern.
 * Handles settings panel creation, physics sliders, and value conversion.
 */

/**
 * Configuration for settings management
 */
export interface UISettingsConfig {
    showControls: boolean;
}

/**
 * Callback function for configuration changes
 */
export interface UISettingsCallbacks {
    onConfigChange?: (key: string, value: unknown) => void;
}

/**
 * Physics control configuration
 */
export interface PhysicsControl {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    value: number;
    description: string;
}

/**
 * UISettingsManager handles settings panel and physics controls
 *
 * Responsibilities:
 * - Create and manage settings panel structure
 * - Generate physics control sliders
 * - Handle settings panel visibility
 * - Convert user values to physics values
 * - Coordinate configuration change callbacks
 * - Prevent panel click-through events
 */
export class UISettingsManager {
    private settingsPanel: HTMLElement | null = null;
    private readonly container: HTMLElement;
    private config: UISettingsConfig;
    private readonly callbacks: UISettingsCallbacks;
    private isVisible: boolean = false;

    // Default physics controls configuration
    private readonly defaultControls: PhysicsControl[] = [
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

    constructor(
        container: HTMLElement,
        config: UISettingsConfig,
        callbacks: UISettingsCallbacks = {}
    ) {
        this.container = container;
        this.config = { ...config };
        this.callbacks = callbacks;
    }

    /**
     * Initialize settings panel
     */
    initialize(): void {
        if (!this.config.showControls || this.settingsPanel) return;

        this.createSettingsPanel();
        this.createPhysicsControls();
        this.setupEventPrevention();
    }

    /**
     * Create settings panel structure
     * @private
     */
    private createSettingsPanel(): void {
        this.settingsPanel = document.createElement('div');
        this.setElementClass(this.settingsPanel, 'graph-network-settings');

        const title = document.createElement('h3');
        title.textContent = 'Physics Settings';
        this.settingsPanel.appendChild(title);

        this.container.appendChild(this.settingsPanel);
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
     * Create physics control sliders
     * @private
     */
    private createPhysicsControls(): void {
        if (!this.settingsPanel) return;

        this.defaultControls.forEach(control => {
            const controlDiv = this.createControlElement(control);
            this.settingsPanel!.appendChild(controlDiv);
        });
    }

    /**
     * Create individual control element
     * @private
     */
    private createControlElement(control: PhysicsControl): HTMLElement {
        const controlDiv = document.createElement('div');
        this.setElementClass(controlDiv, 'graph-network-control');

        // Create label
        const label = document.createElement('label');
        label.textContent = control.label;
        label.setAttribute('title', control.description);

        // Create slider
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = control.min.toString();
        slider.max = control.max.toString();
        slider.step = control.step.toString();
        slider.value = control.value.toString();
        slider.setAttribute('aria-label', `${control.label}: ${control.description}`);

        // Create value display
        const valueDisplay = document.createElement('span');
        this.setElementClass(valueDisplay, 'graph-network-control-value');
        valueDisplay.textContent = control.value.toFixed(1);

        // Set up event listener
        slider.addEventListener('input', e => {
            this.handleSliderChange(e, control, valueDisplay);
        });

        // Assemble control
        controlDiv.appendChild(label);
        controlDiv.appendChild(slider);
        controlDiv.appendChild(valueDisplay);

        return controlDiv;
    }

    /**
     * Handle slider input changes
     * @private
     */
    private handleSliderChange(
        event: Event,
        control: PhysicsControl,
        valueDisplay: HTMLElement
    ): void {
        const target = event.target as HTMLInputElement;
        const userValue = parseFloat(target.value);
        const actualValue = this.convertUserValueToPhysics(control.key, userValue);

        valueDisplay.textContent = userValue.toFixed(1);
        this.callbacks.onConfigChange?.(control.key, actualValue);
    }

    /**
     * Set up event prevention for panel clicks
     * @private
     */
    private setupEventPrevention(): void {
        if (!this.settingsPanel) return;

        // Prevent settings panel from closing when clicked inside
        this.settingsPanel.addEventListener('click', e => {
            e.stopPropagation();
        });
    }

    /**
     * Convert user-friendly 0-20 scale values to actual physics values
     * @private
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
                return parseInt(numValue.toString());
            default:
                return numValue;
        }
    }

    /**
     * Show settings panel
     */
    show(): void {
        if (!this.settingsPanel) return;

        this.isVisible = true;
        this.settingsPanel.classList.add('is-open');
    }

    /**
     * Hide settings panel
     */
    hide(): void {
        if (!this.settingsPanel) return;

        this.isVisible = false;
        this.settingsPanel.classList.remove('is-open');
    }

    /**
     * Toggle settings panel visibility
     */
    toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Set specific control value
     */
    setControlValue(key: string, value: number): void {
        if (!this.settingsPanel) return;

        const controls = this.settingsPanel.querySelectorAll('.graph-network-control');
        controls.forEach(controlDiv => {
            const slider = controlDiv.querySelector('input[type="range"]') as HTMLInputElement;
            const valueDisplay = controlDiv.querySelector(
                '.graph-network-control-value'
            ) as HTMLElement;
            const label = controlDiv.querySelector('label') as HTMLElement;

            if (
                slider &&
                label &&
                label.textContent &&
                this.getControlKeyFromLabel(label.textContent) === key
            ) {
                slider.value = value.toString();
                if (valueDisplay) {
                    valueDisplay.textContent = value.toFixed(1);
                }
            }
        });
    }

    /**
     * Get control key from label text
     * @private
     */
    private getControlKeyFromLabel(labelText: string): string {
        const control = this.defaultControls.find(c => c.label === labelText);
        return control?.key || '';
    }

    /**
     * Get current value of a control
     */
    getControlValue(key: string): number | null {
        if (!this.settingsPanel) return null;

        const control = this.defaultControls.find(c => c.key === key);
        if (!control) return null;

        const controls = this.settingsPanel.querySelectorAll('.graph-network-control');
        for (const controlDiv of controls) {
            const slider = controlDiv.querySelector('input[type="range"]') as HTMLInputElement;
            const label = controlDiv.querySelector('label') as HTMLElement;

            if (slider && label && label.textContent === control.label) {
                return parseFloat(slider.value);
            }
        }

        return null;
    }

    /**
     * Get all control values
     */
    getAllControlValues(): Record<string, number> {
        const values: Record<string, number> = {};

        this.defaultControls.forEach(control => {
            const value = this.getControlValue(control.key);
            if (value !== null) {
                values[control.key] = value;
            }
        });

        return values;
    }

    /**
     * Reset all controls to default values
     */
    resetToDefaults(): void {
        this.defaultControls.forEach(control => {
            this.setControlValue(control.key, control.value);
        });
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<UISettingsConfig>): void {
        const prevShowControls = this.config.showControls;
        Object.assign(this.config, newConfig);

        // Handle visibility changes
        if (!prevShowControls && this.config.showControls && !this.settingsPanel) {
            this.initialize();
        } else if (prevShowControls && !this.config.showControls && this.settingsPanel) {
            this.destroy();
        }
    }

    /**
     * Get current settings panel element
     */
    getSettingsElement(): HTMLElement | null {
        return this.settingsPanel;
    }

    /**
     * Get current configuration
     */
    getConfig(): UISettingsConfig {
        return { ...this.config };
    }

    /**
     * Check if settings panel is currently visible
     */
    isSettingsVisible(): boolean {
        return this.isVisible;
    }

    /**
     * Check if settings panel exists and is initialized
     */
    isInitialized(): boolean {
        return this.settingsPanel !== null;
    }

    /**
     * Get count of available controls
     */
    getControlCount(): number {
        return this.defaultControls.length;
    }

    /**
     * Get available control keys
     */
    getControlKeys(): string[] {
        return this.defaultControls.map(control => control.key);
    }

    /**
     * Clean up settings panel
     */
    destroy(): void {
        if (this.settingsPanel && this.settingsPanel.parentNode) {
            this.settingsPanel.parentNode.removeChild(this.settingsPanel);
        }
        this.settingsPanel = null;
        this.isVisible = false;
    }

    /**
     * Get debugging information
     */
    getDebugInfo(): {
        config: UISettingsConfig;
        hasPanel: boolean;
        isVisible: boolean;
        controlCount: number;
        controlValues: Record<string, number>;
        isAttached: boolean;
    } {
        return {
            config: this.getConfig(),
            hasPanel: this.settingsPanel !== null,
            isVisible: this.isVisible,
            controlCount: this.getControlCount(),
            controlValues: this.getAllControlValues(),
            isAttached: this.settingsPanel?.parentNode !== null
        };
    }
}
