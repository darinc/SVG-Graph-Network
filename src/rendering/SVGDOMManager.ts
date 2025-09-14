/**
 * SVGDOMManager - Manages SVG DOM structure and container setup
 *
 * Extracted from SVGRenderer to reduce complexity and provide focused
 * responsibility for SVG DOM creation and lifecycle management.
 */

import { TransformState, SVGElements } from '../types/index';

export interface SVGDOMConfig {
    /** Show edge labels */
    showLabels?: boolean;
    /** Enable debug mode */
    debug?: boolean;
}

/**
 * Manages the core SVG DOM structure
 */
export class SVGDOMManager {
    private container: HTMLElement;
    private containerId: string;
    private config: SVGDOMConfig;

    // SVG DOM elements
    private canvas: HTMLDivElement | null = null;
    private svg: SVGSVGElement | null = null;
    private transformGroup: SVGGElement | null = null;
    private linkGroup: SVGGElement | null = null;
    private nodeGroup: SVGGElement | null = null;
    private labelGroup: SVGGElement | null = null;

    private transformState: TransformState = {
        x: 0,
        y: 0,
        scale: 1
    };

    constructor(container: HTMLElement, containerId: string, config: SVGDOMConfig = {}) {
        this.container = container;
        this.containerId = containerId;
        this.config = config;
    }

    /**
     * Initialize the SVG DOM structure
     */
    initialize(): void {
        this.createSVGContainer();
        this.createArrowMarker();
    }

    /**
     * Create the main SVG container and groups
     * @private
     */
    private createSVGContainer(): void {
        // Clear existing content
        this.container.innerHTML = '';
        this.container.className = 'svg-graph-network';

        // Create canvas wrapper
        this.canvas = document.createElement('div');
        this.canvas.className = 'graph-canvas';
        this.canvas.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
        `;
        this.container.appendChild(this.canvas);

        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            user-select: none;
            pointer-events: all;
        `;
        this.svg.classList.add('graph-svg');

        // Set SVG attributes
        const rect = this.container.getBoundingClientRect();
        this.svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
        this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        this.canvas.appendChild(this.svg);

        // Create group hierarchy
        this.transformGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.transformGroup.classList.add('transform-group');
        this.svg.appendChild(this.transformGroup);

        // Link group (rendered behind nodes)
        this.linkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.linkGroup.classList.add('links-group');
        this.transformGroup.appendChild(this.linkGroup);

        // Node group
        this.nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.nodeGroup.classList.add('nodes-group');
        this.transformGroup.appendChild(this.nodeGroup);

        // Label group (rendered on top)
        if (this.config.showLabels) {
            this.labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this.labelGroup.classList.add('labels-group');
            this.transformGroup.appendChild(this.labelGroup);
        }
    }

    /**
     * Create arrow marker for directed edges
     * @private
     */
    private createArrowMarker(): void {
        if (!this.svg) return;

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.svg.appendChild(defs);

        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', `arrow-${this.containerId}`);
        marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3');
        marker.setAttribute('markerWidth', '6');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('orient', 'auto');
        marker.classList.add('arrow-marker');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0,0 L0,6 L9,3 z');
        path.classList.add('arrow-marker-path');

        marker.appendChild(path);
        defs.appendChild(marker);
    }

    /**
     * Set viewport transform
     */
    setTransform(x: number, y: number, scale: number): void {
        this.transformState = { x, y, scale };

        if (this.transformGroup) {
            this.transformGroup.setAttribute('transform', `translate(${x}, ${y}) scale(${scale})`);
        }
    }

    /**
     * Get current transform state
     */
    getTransform(): TransformState {
        return { ...this.transformState };
    }

    /**
     * Get SVG element reference
     */
    getSVGElement(): SVGSVGElement | null {
        return this.svg;
    }

    /**
     * Get all SVG group elements
     */
    getSVGElements(): SVGElements | null {
        if (!this.svg || !this.transformGroup || !this.linkGroup || !this.nodeGroup) {
            return null;
        }

        return {
            svg: this.svg,
            transformGroup: this.transformGroup,
            linkGroup: this.linkGroup,
            nodeGroup: this.nodeGroup,
            labelGroup: this.labelGroup
        };
    }

    /**
     * Get specific group elements for element creation
     */
    getGroups(): {
        nodeGroup: SVGGElement | null;
        linkGroup: SVGGElement | null;
        labelGroup: SVGGElement | null;
    } {
        return {
            nodeGroup: this.nodeGroup,
            linkGroup: this.linkGroup,
            labelGroup: this.labelGroup
        };
    }

    /**
     * Handle container resize
     */
    handleResize(): void {
        if (!this.svg) return;

        const rect = this.container.getBoundingClientRect();
        this.svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    }

    /**
     * Clean up DOM elements
     */
    destroy(): void {
        if (this.container) {
            this.container.innerHTML = '';
        }

        this.canvas = null;
        this.svg = null;
        this.transformGroup = null;
        this.linkGroup = null;
        this.nodeGroup = null;
        this.labelGroup = null;
    }
}
