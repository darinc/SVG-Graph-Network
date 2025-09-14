/**
 * UITitleManager - Manages graph title element
 *
 * Extracted from UIManager to reduce God Object anti-pattern.
 * Handles title creation, styling, and theme updates.
 */

import { ThemeManager } from '../../theming/ThemeManager';

/**
 * Configuration for title management
 */
export interface UITitleConfig {
    showTitle: boolean;
    title: string;
}

/**
 * UITitleManager handles graph title display and styling
 *
 * Responsibilities:
 * - Create and manage title DOM element
 * - Apply theme-aware styling
 * - Handle title updates
 * - Manage title lifecycle
 */
export class UITitleManager {
    private titleElement: HTMLElement | null = null;
    private readonly container: HTMLElement;
    private readonly themeManager: ThemeManager;
    private config: UITitleConfig;

    constructor(container: HTMLElement, themeManager: ThemeManager, config: UITitleConfig) {
        this.container = container;
        this.themeManager = themeManager;
        this.config = { ...config };
    }

    /**
     * Initialize title element
     */
    initialize(): void {
        if (!this.config.showTitle || this.titleElement) return;

        this.createTitleElement();
        this.updateTheme();
    }

    /**
     * Create title DOM element
     * @private
     */
    private createTitleElement(): void {
        this.titleElement = document.createElement('h2');
        this.setElementClass(this.titleElement, 'graph-network-title');
        this.titleElement.textContent = this.config.title;
        this.container.appendChild(this.titleElement);
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
     * Update title text
     */
    updateTitle(title: string): void {
        this.config.title = title;
        if (this.titleElement) {
            this.titleElement.textContent = title;
        }
    }

    /**
     * Update title styling based on current theme
     */
    updateTheme(): void {
        if (!this.titleElement) return;

        const foregroundColor = this.themeManager.getColor('foreground');
        if (foregroundColor) {
            this.titleElement.style.color = foregroundColor;
        }
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<UITitleConfig>): void {
        const prevShowTitle = this.config.showTitle;
        Object.assign(this.config, newConfig);

        // Handle visibility changes
        if (!prevShowTitle && this.config.showTitle && !this.titleElement) {
            this.initialize();
        } else if (prevShowTitle && !this.config.showTitle && this.titleElement) {
            this.destroy();
        }

        // Handle title text changes
        if (newConfig.title !== undefined) {
            this.updateTitle(newConfig.title);
        }
    }

    /**
     * Get current title element
     */
    getTitleElement(): HTMLElement | null {
        return this.titleElement;
    }

    /**
     * Get current configuration
     */
    getConfig(): UITitleConfig {
        return { ...this.config };
    }

    /**
     * Check if title is currently visible
     */
    isVisible(): boolean {
        return this.titleElement !== null && this.config.showTitle;
    }

    /**
     * Clean up title element
     */
    destroy(): void {
        if (this.titleElement && this.titleElement.parentNode) {
            this.titleElement.parentNode.removeChild(this.titleElement);
        }
        this.titleElement = null;
    }

    /**
     * Get debugging information
     */
    getDebugInfo(): {
        config: UITitleConfig;
        hasElement: boolean;
        elementText: string | null;
        isAttached: boolean;
    } {
        return {
            config: this.getConfig(),
            hasElement: this.titleElement !== null,
            elementText: this.titleElement?.textContent || null,
            isAttached: this.titleElement?.parentNode !== null
        };
    }
}
