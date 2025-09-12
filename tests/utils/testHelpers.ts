/**
 * Test utilities and helpers for SVG Graph Network tests
 */

import { NodeData, LinkData, GraphData } from '../../src/types/index';

/**
 * Create mock node data for testing
 */
export function createMockNode(overrides: Partial<NodeData> = {}): NodeData {
    return {
        id: 'test-node-1',
        name: 'Test Node',
        type: 'primary',
        shape: 'circle',
        size: 20,
        ...overrides
    };
}

/**
 * Create mock link data for testing
 */
export function createMockLink(overrides: Partial<LinkData> = {}): LinkData {
    return {
        source: 'node1',
        target: 'node2',
        label: 'test link',
        weight: 1,
        line_type: 'solid',
        ...overrides
    };
}

/**
 * Create sample graph data for testing
 */
export function createSampleGraphData(): GraphData {
    return {
        nodes: [
            createMockNode({ id: 'node1', name: 'Node 1', type: 'primary' }),
            createMockNode({ id: 'node2', name: 'Node 2', type: 'secondary' }),
            createMockNode({ id: 'node3', name: 'Node 3', type: 'tertiary' }),
            createMockNode({ id: 'node4', name: 'Node 4', type: 'primary', shape: 'rectangle' })
        ],
        links: [
            createMockLink({ source: 'node1', target: 'node2', label: 'connects to' }),
            createMockLink({ source: 'node2', target: 'node3', label: 'flows to' }),
            createMockLink({ source: 'node3', target: 'node4', label: 'leads to' }),
            createMockLink({ source: 'node1', target: 'node4', label: 'related to', line_type: 'dashed' })
        ]
    };
}

/**
 * Create a mock DOM container element
 */
export function createMockContainer(id: string = 'test-container'): HTMLElement {
    const container = document.createElement('div');
    container.id = id;
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    return container;
}

/**
 * Clean up mock container
 */
export function cleanupContainer(container: HTMLElement | null): void {
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }
}

/**
 * Create mock event object
 */
export function createMockEvent(type: string = 'click', overrides: Partial<Event> = {}): Event & { clientX?: number; clientY?: number; target?: Element } {
    return {
        type,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        clientX: 100,
        clientY: 100,
        target: document.createElement('div'),
        ...overrides
    } as any;
}

/**
 * Create mock touch event
 */
export function createMockTouchEvent(type: string = 'touchstart', overrides: Partial<TouchEvent> = {}): TouchEvent {
    return {
        type,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        touches: [
            { clientX: 100, clientY: 100, identifier: 0 } as Touch
        ],
        changedTouches: [
            { clientX: 100, clientY: 100, identifier: 0 } as Touch
        ],
        ...overrides
    } as TouchEvent;
}

/**
 * Wait for next animation frame in tests
 */
export function waitForAnimationFrame(): Promise<void> {
    return new Promise(resolve => {
        requestAnimationFrame(() => resolve());
    });
}

/**
 * Wait for multiple animation frames
 */
export function waitForAnimationFrames(count: number = 1): Promise<void> {
    let promise = Promise.resolve();
    for (let i = 0; i < count; i++) {
        promise = promise.then(() => waitForAnimationFrame());
    }
    return promise;
}

/**
 * Get SVG element by class name
 */
export function getSVGElementByClass(container: Element, className: string): Element | null {
    return container.querySelector(`svg .${className}`);
}

/**
 * Get all SVG elements by class name
 */
export function getAllSVGElementsByClass(container: Element, className: string): Element[] {
    return Array.from(container.querySelectorAll(`svg .${className}`));
}

/**
 * Assert that an SVG element exists
 */
export function expectSVGElement(container: Element, selector: string): Element {
    const element = container.querySelector(`svg ${selector}`);
    expect(element).toBeTruthy();
    return element!;
}

/**
 * Mock physics configuration
 */
export function createMockPhysicsConfig() {
    return {
        damping: 0.95,
        repulsionStrength: 6500,
        attractionStrength: 0.001,
        groupingStrength: 0.001
    };
}

/**
 * Mock UI configuration
 */
export function createMockUIConfig() {
    return {
        showControls: true,
        showLegend: true,
        showTitle: true,
        showBreadcrumbs: true,
        theme: 'dark',
        title: 'Test Graph'
    };
}

/**
 * Create mock callbacks object
 */
export function createMockCallbacks() {
    return {
        onZoomIn: jest.fn(),
        onZoomOut: jest.fn(),
        onResetView: jest.fn(),
        onToggleTheme: jest.fn(),
        onConfigChange: jest.fn(),
        onBreadcrumbClick: jest.fn(),
        getNodeElements: jest.fn(() => new Map()),
        fixNode: jest.fn(),
        unfixNode: jest.fn(),
        filterByNode: jest.fn(),
        resetFilter: jest.fn(),
        updateTransform: jest.fn(),
        showTooltip: jest.fn(),
        hideTooltip: jest.fn(),
        closeSettings: jest.fn(),
        resize: jest.fn()
    };
}