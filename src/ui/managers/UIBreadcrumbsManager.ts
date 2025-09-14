/**
 * UIBreadcrumbsManager - Manages breadcrumb navigation
 *
 * Extracted from UIManager to reduce God Object anti-pattern.
 * Handles breadcrumb rendering, click events, and navigation state.
 */

/**
 * Configuration for breadcrumbs management
 */
export interface UIBreadcrumbsConfig {
    showBreadcrumbs: boolean;
}

/**
 * Breadcrumb navigation item
 */
export interface BreadcrumbItem {
    name: string;
    action?: string;
}

/**
 * Callback function for breadcrumb interactions
 */
export interface UIBreadcrumbsCallbacks {
    onBreadcrumbClick?: (action: string) => void;
}

/**
 * UIBreadcrumbsManager handles breadcrumb navigation display and interaction
 *
 * Responsibilities:
 * - Create and manage breadcrumb navigation structure
 * - Render breadcrumb items with separators
 * - Handle breadcrumb click events
 * - Manage navigation path state
 * - Apply styling and accessibility attributes
 */
export class UIBreadcrumbsManager {
    private breadcrumbsElement: HTMLElement | null = null;
    private readonly container: HTMLElement;
    private config: UIBreadcrumbsConfig;
    private readonly callbacks: UIBreadcrumbsCallbacks;
    private currentPath: BreadcrumbItem[] = [];

    constructor(
        container: HTMLElement,
        config: UIBreadcrumbsConfig,
        callbacks: UIBreadcrumbsCallbacks = {}
    ) {
        this.container = container;
        this.config = { ...config };
        this.callbacks = callbacks;
    }

    /**
     * Initialize breadcrumb navigation
     */
    initialize(): void {
        if (!this.config.showBreadcrumbs || this.breadcrumbsElement) return;

        this.createBreadcrumbsElement();
    }

    /**
     * Create breadcrumbs DOM element
     * @private
     */
    private createBreadcrumbsElement(): void {
        this.breadcrumbsElement = document.createElement('div');
        this.setElementClass(this.breadcrumbsElement, 'graph-network-breadcrumbs');
        this.breadcrumbsElement.setAttribute('role', 'navigation');
        this.breadcrumbsElement.setAttribute('aria-label', 'Breadcrumb navigation');
        this.container.appendChild(this.breadcrumbsElement);
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
     * Render breadcrumb navigation path
     */
    renderBreadcrumbs(path: BreadcrumbItem[]): void {
        if (!this.config.showBreadcrumbs) return;

        if (!this.breadcrumbsElement) {
            this.initialize();
        }

        if (!this.breadcrumbsElement) return;

        this.currentPath = [...path];
        this.clearBreadcrumbs();
        this.renderBreadcrumbItems(path);
    }

    /**
     * Clear current breadcrumb content
     * @private
     */
    private clearBreadcrumbs(): void {
        if (this.breadcrumbsElement) {
            this.breadcrumbsElement.innerHTML = '';
        }
    }

    /**
     * Render individual breadcrumb items
     * @private
     */
    private renderBreadcrumbItems(path: BreadcrumbItem[]): void {
        if (!this.breadcrumbsElement) return;

        path.forEach((item, index) => {
            // Add separator before each item except the first
            if (index > 0) {
                const separator = this.createSeparator();
                this.breadcrumbsElement!.appendChild(separator);
            }

            // Create breadcrumb item
            const breadcrumbItem = this.createBreadcrumbItem(item, index, path.length);
            this.breadcrumbsElement!.appendChild(breadcrumbItem);
        });
    }

    /**
     * Create breadcrumb separator
     * @private
     */
    private createSeparator(): HTMLElement {
        const separator = document.createElement('span');
        this.setElementClass(separator, 'graph-network-breadcrumb-separator');
        separator.textContent = ' > ';
        separator.setAttribute('aria-hidden', 'true');
        return separator;
    }

    /**
     * Create individual breadcrumb item
     * @private
     */
    private createBreadcrumbItem(
        item: BreadcrumbItem,
        index: number,
        totalLength: number
    ): HTMLElement {
        const breadcrumb = document.createElement('span');
        this.setElementClass(breadcrumb, 'graph-network-breadcrumb');

        // Mark last item as active
        const isLast = index === totalLength - 1;
        if (isLast) {
            breadcrumb.classList.add('active');
            breadcrumb.setAttribute('aria-current', 'page');
        }

        breadcrumb.textContent = item.name;

        // Add action attribute if present
        if (item.action) {
            breadcrumb.setAttribute('data-action', item.action);

            // Only make clickable if not the last item (current page)
            if (!isLast) {
                breadcrumb.setAttribute('role', 'button');
                breadcrumb.setAttribute('tabindex', '0');
                breadcrumb.style.cursor = 'pointer';

                // Add click event listener
                breadcrumb.addEventListener('click', () => {
                    if (item.action) {
                        this.callbacks.onBreadcrumbClick?.(item.action);
                    }
                });

                // Add keyboard support
                breadcrumb.addEventListener('keydown', e => {
                    if ((e.key === 'Enter' || e.key === ' ') && item.action) {
                        e.preventDefault();
                        this.callbacks.onBreadcrumbClick?.(item.action);
                    }
                });
            }
        }

        return breadcrumb;
    }

    /**
     * Add breadcrumb item to current path
     */
    addBreadcrumb(item: BreadcrumbItem): void {
        this.currentPath.push(item);
        this.renderBreadcrumbs(this.currentPath);
    }

    /**
     * Remove last breadcrumb from current path
     */
    popBreadcrumb(): BreadcrumbItem | undefined {
        const popped = this.currentPath.pop();
        this.renderBreadcrumbs(this.currentPath);
        return popped;
    }

    /**
     * Clear all breadcrumbs
     */
    clearPath(): void {
        this.currentPath = [];
        this.renderBreadcrumbs(this.currentPath);
    }

    /**
     * Set entire breadcrumb path
     */
    setPath(path: BreadcrumbItem[]): void {
        this.renderBreadcrumbs(path);
    }

    /**
     * Get current breadcrumb path
     */
    getCurrentPath(): BreadcrumbItem[] {
        return [...this.currentPath];
    }

    /**
     * Get current breadcrumb count
     */
    getBreadcrumbCount(): number {
        return this.currentPath.length;
    }

    /**
     * Check if breadcrumbs are empty
     */
    isEmpty(): boolean {
        return this.currentPath.length === 0;
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<UIBreadcrumbsConfig>): void {
        const prevShowBreadcrumbs = this.config.showBreadcrumbs;
        Object.assign(this.config, newConfig);

        // Handle visibility changes
        if (!prevShowBreadcrumbs && this.config.showBreadcrumbs && !this.breadcrumbsElement) {
            this.initialize();
            // Re-render current path if we have one
            if (this.currentPath.length > 0) {
                this.renderBreadcrumbs(this.currentPath);
            }
        } else if (prevShowBreadcrumbs && !this.config.showBreadcrumbs && this.breadcrumbsElement) {
            this.destroy();
        }
    }

    /**
     * Get current breadcrumbs element
     */
    getBreadcrumbsElement(): HTMLElement | null {
        return this.breadcrumbsElement;
    }

    /**
     * Get current configuration
     */
    getConfig(): UIBreadcrumbsConfig {
        return { ...this.config };
    }

    /**
     * Check if breadcrumbs are currently visible
     */
    isVisible(): boolean {
        return this.breadcrumbsElement !== null && this.config.showBreadcrumbs;
    }

    /**
     * Check if breadcrumbs are initialized
     */
    isInitialized(): boolean {
        return this.breadcrumbsElement !== null;
    }

    /**
     * Find breadcrumb by action
     */
    findBreadcrumbByAction(action: string): BreadcrumbItem | undefined {
        return this.currentPath.find(item => item.action === action);
    }

    /**
     * Get index of breadcrumb by action
     */
    getBreadcrumbIndex(action: string): number {
        return this.currentPath.findIndex(item => item.action === action);
    }

    /**
     * Navigate to specific breadcrumb by action (removes all items after it)
     */
    navigateTo(action: string): boolean {
        const index = this.getBreadcrumbIndex(action);
        if (index >= 0) {
            this.currentPath = this.currentPath.slice(0, index + 1);
            this.renderBreadcrumbs(this.currentPath);
            return true;
        }
        return false;
    }

    /**
     * Clean up breadcrumbs element
     */
    destroy(): void {
        if (this.breadcrumbsElement && this.breadcrumbsElement.parentNode) {
            this.breadcrumbsElement.parentNode.removeChild(this.breadcrumbsElement);
        }
        this.breadcrumbsElement = null;
    }

    /**
     * Get debugging information
     */
    getDebugInfo(): {
        config: UIBreadcrumbsConfig;
        hasElement: boolean;
        pathLength: number;
        currentPath: BreadcrumbItem[];
        isEmpty: boolean;
        isAttached: boolean;
    } {
        return {
            config: this.getConfig(),
            hasElement: this.breadcrumbsElement !== null,
            pathLength: this.currentPath.length,
            currentPath: this.getCurrentPath(),
            isEmpty: this.isEmpty(),
            isAttached: this.breadcrumbsElement?.parentNode !== null
        };
    }
}
