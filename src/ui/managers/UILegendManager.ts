/**
 * UILegendManager - Manages graph legend display
 *
 * Extracted from UIManager to reduce God Object anti-pattern.
 * Handles legend creation, node type analysis, and theme updates.
 */

import { Node } from '../../Node';
import { NodeData } from '../../types/index';
import { ThemeManager } from '../../theming/ThemeManager';

/**
 * Configuration for legend management
 */
export interface UILegendConfig {
    showLegend: boolean;
}

/**
 * Legend item representing a node type
 */
export interface LegendItem {
    type: string;
    shape: 'circle' | 'rectangle' | 'square' | 'triangle';
    color: string;
    stroke?: string;
    strokeWidth?: string;
}

/**
 * UILegendManager handles legend display and node type visualization
 *
 * Responsibilities:
 * - Generate legend items from node types
 * - Create and manage legend DOM structure
 * - Handle legend toggle functionality
 * - Apply theme-aware styling to legend
 * - Update legend when nodes change
 */
export class UILegendManager {
    private legendElement: HTMLElement | null = null;
    private readonly container: HTMLElement;
    private readonly themeManager: ThemeManager;
    private config: UILegendConfig;
    private isMinimized: boolean = false;

    constructor(container: HTMLElement, themeManager: ThemeManager, config: UILegendConfig) {
        this.container = container;
        this.themeManager = themeManager;
        this.config = { ...config };
    }

    /**
     * Initialize legend element structure
     */
    initialize(): void {
        if (!this.config.showLegend || this.legendElement) return;

        this.createLegendStructure();
        this.updateTheme();
    }

    /**
     * Create legend DOM structure
     * @private
     */
    private createLegendStructure(): void {
        this.legendElement = document.createElement('div');
        this.setElementClass(this.legendElement, 'graph-network-legend');

        // Create header with toggle button
        const header = document.createElement('div');
        this.setElementClass(header, 'graph-network-legend-header');
        header.textContent = 'Node Types';

        const toggleButton = document.createElement('button');
        this.setElementClass(toggleButton, 'graph-network-legend-toggle');
        toggleButton.textContent = '−';
        toggleButton.addEventListener('click', () => this.toggleMinimized());

        header.appendChild(toggleButton);
        this.legendElement.appendChild(header);

        // Create content container
        const content = document.createElement('div');
        this.setElementClass(content, 'graph-network-legend-content');
        this.legendElement.appendChild(content);

        this.container.appendChild(this.legendElement);
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
     * Generate legend items from node analysis
     * @private
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
     * Get color for node type from theme
     * @private
     */
    private getNodeTypeColor(type: string): string {
        const nodeStyle = this.themeManager.getNodeStyle(type);
        if (nodeStyle.fill) {
            return nodeStyle.fill;
        }
        return this.themeManager.getColor('primary') || '#666666';
    }

    /**
     * Create or update legend with nodes
     */
    updateLegend<T extends NodeData>(nodes: Node<T>[] = []): void {
        if (!this.config.showLegend) return;

        if (!this.legendElement) {
            this.initialize();
        }

        if (!this.legendElement) return;

        const content = this.legendElement.querySelector(
            '.graph-network-legend-content'
        ) as HTMLElement;
        if (!content) return;

        const legendItems = this.generateLegendItems(nodes);
        this.renderLegendItems(content, legendItems);
    }

    /**
     * Render legend items in content container
     * @private
     */
    private renderLegendItems(content: HTMLElement, legendItems: LegendItem[]): void {
        content.innerHTML = '';

        legendItems.forEach(item => {
            const legendItem = document.createElement('div');
            this.setElementClass(legendItem, 'graph-network-legend-item');

            // Create shape indicator
            const shape = document.createElement('div');
            this.setElementClass(
                shape,
                `graph-network-legend-shape graph-network-legend-${item.shape}`
            );
            shape.style.backgroundColor = item.color;

            // Apply border styling
            if (item.stroke) {
                const strokeWidth = item.strokeWidth ? `${item.strokeWidth}px` : '2px';
                shape.style.border = `${strokeWidth} solid ${item.stroke}`;
            } else {
                const fallbackColor = this.themeManager.getColor('foreground') || '#666666';
                shape.style.border = `2px solid ${fallbackColor}`;
            }

            // Create label
            const label = document.createElement('span');
            label.textContent = this.formatTypeName(item.type);

            // Apply theme colors
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
     * Format type name for display
     * @private
     */
    private formatTypeName(type: string): string {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Toggle legend minimized state
     */
    private toggleMinimized(): void {
        if (!this.legendElement) return;

        const toggleButton = this.legendElement.querySelector(
            '.graph-network-legend-toggle'
        ) as HTMLButtonElement;

        this.isMinimized = !this.isMinimized;

        if (this.isMinimized) {
            this.legendElement.classList.add('minimized');
            if (toggleButton) toggleButton.textContent = '+';
        } else {
            this.legendElement.classList.remove('minimized');
            if (toggleButton) toggleButton.textContent = '−';
        }
    }

    /**
     * Set minimized state programmatically
     */
    setMinimized(minimized: boolean): void {
        if (this.isMinimized === minimized) return;
        this.toggleMinimized();
    }

    /**
     * Update legend styling based on current theme
     */
    updateTheme(): void {
        if (!this.legendElement) return;

        const backgroundColor = this.themeManager.getColor('background');
        const foregroundColor = this.themeManager.getColor('foreground');
        const currentTheme = this.themeManager.getCurrentTheme();

        // Update legend background and shadow
        if (backgroundColor) {
            this.legendElement.style.backgroundColor = backgroundColor;

            // Add appropriate shadow based on theme
            if (currentTheme.name === 'dark' || currentTheme.name === 'default') {
                this.legendElement.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.1)';
            } else {
                this.legendElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }
        }

        // Update text colors
        if (foregroundColor) {
            const header = this.legendElement.querySelector('.graph-network-legend-header');
            if (header && header instanceof HTMLElement) {
                header.style.color = foregroundColor;
            }

            const toggleButton = this.legendElement.querySelector('.graph-network-legend-toggle');
            if (toggleButton && toggleButton instanceof HTMLElement) {
                toggleButton.style.color = foregroundColor;
                toggleButton.style.borderColor = foregroundColor;
            }

            // Update legend item text
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
     * Update configuration
     */
    updateConfig(newConfig: Partial<UILegendConfig>): void {
        const prevShowLegend = this.config.showLegend;
        Object.assign(this.config, newConfig);

        // Handle visibility changes
        if (!prevShowLegend && this.config.showLegend && !this.legendElement) {
            this.initialize();
        } else if (prevShowLegend && !this.config.showLegend && this.legendElement) {
            this.destroy();
        }
    }

    /**
     * Get current legend element
     */
    getLegendElement(): HTMLElement | null {
        return this.legendElement;
    }

    /**
     * Get current configuration
     */
    getConfig(): UILegendConfig {
        return { ...this.config };
    }

    /**
     * Check if legend is currently visible
     */
    isVisible(): boolean {
        return this.legendElement !== null && this.config.showLegend;
    }

    /**
     * Check if legend is minimized
     */
    getIsMinimized(): boolean {
        return this.isMinimized;
    }

    /**
     * Get count of legend items currently displayed
     */
    getItemCount(): number {
        if (!this.legendElement) return 0;
        const items = this.legendElement.querySelectorAll('.graph-network-legend-item');
        return items.length;
    }

    /**
     * Clean up legend element
     */
    destroy(): void {
        if (this.legendElement && this.legendElement.parentNode) {
            this.legendElement.parentNode.removeChild(this.legendElement);
        }
        this.legendElement = null;
        this.isMinimized = false;
    }

    /**
     * Get debugging information
     */
    getDebugInfo(): {
        config: UILegendConfig;
        hasElement: boolean;
        isMinimized: boolean;
        itemCount: number;
        isAttached: boolean;
    } {
        return {
            config: this.getConfig(),
            hasElement: this.legendElement !== null,
            isMinimized: this.isMinimized,
            itemCount: this.getItemCount(),
            isAttached: this.legendElement?.parentNode !== null
        };
    }
}
