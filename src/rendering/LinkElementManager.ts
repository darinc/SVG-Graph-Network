/**
 * LinkElementManager - Manages link/edge visual elements creation and positioning
 *
 * Extracted from SVGRenderer to focus on link-specific DOM operations.
 * Handles link element creation, positioning, labeling, and lifecycle management.
 */

import { Node } from '../Node';
import { NodeData } from '../types/index';
import { ThemeManager, VisualState } from '../theming/ThemeManager';

/**
 * Link representation for rendering
 */
export interface RenderLink<T extends NodeData = NodeData> {
    source: Node<T>;
    target: Node<T>;
    label?: string;
    weight?: number;
    line_type?: 'solid' | 'dashed' | 'dotted';
}

/**
 * Link element structure in the DOM
 */
export interface LinkElements {
    linkEl: SVGLineElement;
    labelText: SVGTextElement;
    labelBackground: SVGRectElement;
}

export interface LinkElementConfig {
    /** Show edge labels */
    showLabels?: boolean;
    /** Text font family */
    fontFamily?: string;
    /** Text font size */
    fontSize?: number;
    /** Container ID for marker references */
    containerId: string;
}

/**
 * Manages link visual elements
 */
export class LinkElementManager<T extends NodeData = NodeData> {
    private config: LinkElementConfig;
    private themeManager: ThemeManager;
    private linkGroup: SVGGElement | null = null;
    private labelGroup: SVGGElement | null = null;

    // Element tracking
    private readonly linkElements = new Map<RenderLink<T>, LinkElements>();

    constructor(config: LinkElementConfig, themeManager: ThemeManager) {
        this.config = config;
        this.themeManager = themeManager;
    }

    /**
     * Set the link and label group containers
     */
    setGroups(linkGroup: SVGGElement | null, labelGroup: SVGGElement | null): void {
        this.linkGroup = linkGroup;
        this.labelGroup = labelGroup;
    }

    /**
     * Create elements for all links
     */
    createLinkElements(links: RenderLink<T>[]): void {
        if (!this.linkGroup) return;

        // Clear existing elements
        this.clearElements();

        // Create elements for each link
        links.forEach(link => {
            const elements = this.createSingleLinkElement(link);
            if (elements) {
                this.linkElements.set(link, elements);
                this.linkGroup!.appendChild(elements.linkEl);

                // Add labels if enabled
                if (this.config.showLabels && this.labelGroup) {
                    this.labelGroup.appendChild(elements.labelBackground);
                    this.labelGroup.appendChild(elements.labelText);
                }
            }
        });
    }

    /**
     * Create elements for a single link
     * @private
     */
    private createSingleLinkElement(link: RenderLink<T>): LinkElements | null {
        // Create line element
        const linkEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        linkEl.classList.add('link');

        // Set link ID if available
        const linkId = this.getLinkId(link);
        if (linkId) {
            linkEl.setAttribute('data-id', linkId);
        }

        // Apply arrow marker for directed edges
        linkEl.setAttribute('marker-end', `url(#arrow-${this.config.containerId})`);

        // Apply line type styling
        if (link.line_type) {
            this.applyLineType(linkEl, link.line_type);
        }

        // Apply theme-based styling
        this.applyEdgeStyles(linkEl, 'default', linkId || '');

        // Create label elements
        const { labelText, labelBackground } = this.createLinkLabel(link);

        return {
            linkEl,
            labelText,
            labelBackground
        };
    }

    /**
     * Create label elements for a link
     * @private
     */
    private createLinkLabel(link: RenderLink<T>): {
        labelText: SVGTextElement;
        labelBackground: SVGRectElement;
    } {
        // Create label text
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.classList.add('link-label');
        labelText.setAttribute('text-anchor', 'middle');
        labelText.setAttribute('dominant-baseline', 'central');
        labelText.setAttribute('pointer-events', 'none');

        // Set label content
        const labelContent = link.label || (link.weight ? link.weight.toString() : '');
        labelText.textContent = labelContent;

        // Apply font styling
        if (this.config.fontFamily) {
            labelText.style.fontFamily = this.config.fontFamily;
        }
        if (this.config.fontSize) {
            labelText.style.fontSize = `${this.config.fontSize * 0.8}px`; // Smaller than node text
        }

        // Create label background
        const labelBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        labelBackground.classList.add('link-label-background');
        labelBackground.setAttribute('pointer-events', 'none');

        return { labelText, labelBackground };
    }

    /**
     * Apply line type styling
     * @private
     */
    private applyLineType(linkEl: SVGLineElement, lineType: string): void {
        switch (lineType) {
            case 'dashed':
                linkEl.style.strokeDasharray = '5,5';
                break;
            case 'dotted':
                linkEl.style.strokeDasharray = '2,2';
                break;
            case 'solid':
            default:
                linkEl.style.strokeDasharray = 'none';
                break;
        }
    }

    /**
     * Apply theme-based styles to an edge element
     * @private
     */
    private applyEdgeStyles(element: SVGElement, edgeType: string, edgeId: string): void {
        const states = this.themeManager.getElementStates(edgeId);
        const style = this.themeManager.getEdgeStyle(edgeType, states);

        // Apply each style attribute
        Object.entries(style).forEach(([attr, value]) => {
            if (value !== undefined) {
                element.setAttribute(attr, String(value));
            }
        });
    }

    /**
     * Update positions for all link elements
     */
    updateLinkPositions(filteredNodes: Set<string> | null = null): void {
        this.linkElements.forEach((elements, link) => {
            this.updateSingleLinkPosition(elements, link, filteredNodes);
        });
    }

    /**
     * Update position for a single link
     * @private
     */
    private updateSingleLinkPosition(
        elements: LinkElements,
        link: RenderLink<T>,
        filteredNodes: Set<string> | null
    ): void {
        // Check if both nodes are visible
        const sourceVisible = !filteredNodes || filteredNodes.has(link.source.getId());
        const targetVisible = !filteredNodes || filteredNodes.has(link.target.getId());
        const isVisible = sourceVisible && targetVisible;

        // Hide link if either node is filtered out
        elements.linkEl.style.display = isVisible ? '' : 'none';
        elements.labelText.style.display = isVisible ? '' : 'none';
        elements.labelBackground.style.display = isVisible ? '' : 'none';

        if (!isVisible) return;

        // Calculate positions
        const sourcePos = link.source.position;
        const targetPos = link.target.position;

        // Calculate edge intersection point (to avoid overlapping with node)
        const endPoint = this.calculateEdgeIntersection(link.source, link.target, targetPos);

        // Update line position
        elements.linkEl.setAttribute('x1', sourcePos.x.toString());
        elements.linkEl.setAttribute('y1', sourcePos.y.toString());
        elements.linkEl.setAttribute('x2', endPoint.x.toString());
        elements.linkEl.setAttribute('y2', endPoint.y.toString());

        // Update label position and background
        if (this.config.showLabels && elements.labelText.textContent) {
            this.updateLabelPosition(elements, sourcePos, endPoint);
        }
    }

    /**
     * Update label position and background
     * @private
     */
    private updateLabelPosition(
        elements: LinkElements,
        sourcePos: { x: number; y: number },
        endPos: { x: number; y: number }
    ): void {
        // Calculate midpoint
        const midX = (sourcePos.x + endPos.x) / 2;
        const midY = (sourcePos.y + endPos.y) / 2;

        // Position label text
        elements.labelText.setAttribute('x', midX.toString());
        elements.labelText.setAttribute('y', midY.toString());

        // Update label background
        this.updateLabelBackground(elements.labelBackground, elements.labelText);
    }

    /**
     * Update label background size and position
     * @private
     */
    private updateLabelBackground(background: SVGRectElement, text: SVGTextElement): void {
        try {
            const bbox = text.getBBox();
            const padding = 2;

            background.setAttribute('x', (bbox.x - padding).toString());
            background.setAttribute('y', (bbox.y - padding).toString());
            background.setAttribute('width', (bbox.width + padding * 2).toString());
            background.setAttribute('height', (bbox.height + padding * 2).toString());
            background.setAttribute('rx', '2');
        } catch {
            // Fallback if getBBox fails
            const textLength = (text.textContent || '').length;
            const estimatedWidth = textLength * 8;
            const fontSize = this.config.fontSize || 12;

            background.setAttribute('width', estimatedWidth.toString());
            background.setAttribute('height', (fontSize + 4).toString());
            background.setAttribute('rx', '2');
        }
    }

    /**
     * Calculate edge intersection point to avoid overlapping with target node
     * @private
     */
    private calculateEdgeIntersection(
        source: Node<T>,
        target: Node<T>,
        targetPos: { x: number; y: number }
    ): { x: number; y: number } {
        const sourcePos = source.position;
        const targetRadius = target.getEffectiveRadius();

        // Calculate direction vector
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return targetPos;

        // Calculate intersection point
        const intersectionDistance = distance - targetRadius;
        const ratio = intersectionDistance / distance;

        return {
            x: sourcePos.x + dx * ratio,
            y: sourcePos.y + dy * ratio
        };
    }

    /**
     * Get link ID for tracking
     * @private
     */
    private getLinkId(link: RenderLink<T>): string {
        return `${link.source.getId()}-${link.target.getId()}`;
    }

    /**
     * Update element visual state
     */
    updateElementState(elementId: string, state: VisualState, enabled: boolean): void {
        // Find the link element
        for (const [link, elements] of this.linkElements) {
            const linkId = this.getLinkId(link);
            if (linkId === elementId) {
                this.themeManager.setElementState(elementId, state, enabled);

                // Reapply styles
                this.applyEdgeStyles(elements.linkEl, 'default', elementId);
                break;
            }
        }
    }

    /**
     * Get link elements map (readonly)
     */
    getLinkElements(): ReadonlyMap<RenderLink<T>, LinkElements> {
        return this.linkElements;
    }

    /**
     * Clear all link elements
     */
    clearElements(): void {
        this.linkElements.clear();
        if (this.linkGroup) {
            this.linkGroup.innerHTML = '';
        }
        if (this.labelGroup) {
            this.labelGroup.innerHTML = '';
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.clearElements();
        this.linkGroup = null;
        this.labelGroup = null;
    }
}
