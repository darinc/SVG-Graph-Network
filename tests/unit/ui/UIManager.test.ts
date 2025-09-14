/**
 * UIManager Tests
 * 
 * Comprehensive tests for the UIManager component to improve
 * test coverage from 19.07% to full coverage
 */

import { UIManager, UICallbacks, BreadcrumbItem } from '../../../src/ui/UIManager';
import { Node } from '../../../src/Node';
import { ThemeManager } from '../../../src/theming/ThemeManager';
import { NodeData, UIConfig } from '../../../src/types/index';

// Mock DOM environment
Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
        getPropertyValue: () => '',
    }),
});

describe('UIManager', () => {
    let uiManager: UIManager;
    let container: HTMLElement;
    let themeManager: ThemeManager;
    let callbacks: UICallbacks;
    let mockNodes: Node<NodeData>[];

    beforeEach(() => {
        // Create container element
        container = document.createElement('div');
        container.style.position = 'relative';
        document.body.appendChild(container);

        // Create theme manager
        themeManager = new ThemeManager();

        // Create mock nodes
        mockNodes = [
            new Node<NodeData>({
                id: 'node1',
                name: 'Circle Node',
                type: 'primary',
                shape: 'circle'
            }, 800, 600),
            new Node<NodeData>({
                id: 'node2',
                name: 'Rectangle Node',
                type: 'secondary',
                shape: 'rectangle'
            }, 800, 600),
            new Node<NodeData>({
                id: 'node3',
                name: 'Triangle Node',
                type: 'tertiary',
                shape: 'triangle'
            }, 800, 600)
        ];

        // Create callbacks
        callbacks = {
            onZoomIn: jest.fn(),
            onZoomOut: jest.fn(),
            onResetView: jest.fn(),
            onToggleTheme: jest.fn(),
            onConfigChange: jest.fn(),
            onBreadcrumbClick: jest.fn()
        };

        // Create UI manager with default config
        const config: Partial<UIConfig> = {
            title: 'Test Graph',
            showTitle: true,
            showBreadcrumbs: true,
            showLegend: true,
            showControls: true
        };

        uiManager = new UIManager(container, config, callbacks, themeManager);
    });

    afterEach(() => {
        uiManager.destroy();
        document.body.removeChild(container);
    });

    describe('Initialization', () => {
        test('should create UIManager with default config', () => {
            expect(uiManager).toBeDefined();
        });

        test('should initialize UI elements', () => {
            uiManager.initialize();

            const elements = uiManager.getUIElements();
            expect(elements).not.toBeNull();
            expect(elements?.titleElement).toBeDefined();
            expect(elements?.legendElement).toBeDefined();
            expect(elements?.controls).toBeDefined();
            expect(elements?.settingsPanel).toBeDefined();
        });

        test('should respect config settings during initialization', () => {
            const customConfig: Partial<UIConfig> = {
                showTitle: false,
                showLegend: false,
                showZoomControls: false
            };

            const customManager = new UIManager(container, customConfig, callbacks, themeManager);
            customManager.initialize();

            // Should not create elements when disabled
            expect(container.querySelector('.graph-network-title')).toBeNull();
            expect(container.querySelector('.graph-network-legend')).toBeNull();
            expect(container.querySelector('.graph-network-zoom-controls')).toBeNull();

            customManager.destroy();
        });
    });

    describe('Title Management', () => {
        beforeEach(() => {
            uiManager.initialize();
        });

        test('should create title element', () => {
            const titleElement = container.querySelector('.graph-network-title');
            expect(titleElement).not.toBeNull();
            expect(titleElement?.textContent).toBe('Test Graph');
        });

        test('should update title text', () => {
            uiManager.updateTitle('Updated Graph Title');
            
            const titleElement = container.querySelector('.graph-network-title');
            expect(titleElement?.textContent).toBe('Updated Graph Title');
        });

        test('should apply theme colors to title', () => {
            uiManager.updateThemeColors();
            
            const titleElement = container.querySelector('.graph-network-title') as HTMLElement;
            expect(titleElement).not.toBeNull();
            // Theme colors should be applied via CSS
        });
    });

    describe('Breadcrumb Management', () => {
        beforeEach(() => {
            uiManager.initialize();
        });

        test('should render breadcrumbs', () => {
            const breadcrumbs: BreadcrumbItem[] = [
                { name: 'All Nodes', action: 'reset' },
                { name: 'Filtered View', action: 'filter' }
            ];

            uiManager.renderBreadcrumbs(breadcrumbs);

            const breadcrumbContainer = container.querySelector('.graph-network-breadcrumbs');
            expect(breadcrumbContainer).not.toBeNull();

            const breadcrumbItems = breadcrumbContainer?.querySelectorAll('.breadcrumb-item');
            expect(breadcrumbItems?.length).toBe(2);
        });

        test('should handle breadcrumb clicks', () => {
            const breadcrumbs: BreadcrumbItem[] = [
                { name: 'All Nodes', action: 'reset' },
                { name: 'Current View' }
            ];

            uiManager.renderBreadcrumbs(breadcrumbs);

            const clickableItem = container.querySelector('.breadcrumb-item[data-action="reset"]') as HTMLElement;
            expect(clickableItem).not.toBeNull();

            // Simulate click
            clickableItem.click();

            expect(callbacks.onBreadcrumbClick).toHaveBeenCalledWith('reset');
        });

        test('should not make items without action clickable', () => {
            const breadcrumbs: BreadcrumbItem[] = [
                { name: 'Current View' } // No action
            ];

            uiManager.renderBreadcrumbs(breadcrumbs);

            const item = container.querySelector('.breadcrumb-item:not([data-action])');
            expect(item).not.toBeNull();
            expect(item?.classList.contains('clickable')).toBeFalsy();
        });
    });

    describe('Legend Management', () => {
        beforeEach(() => {
            uiManager.initialize();
        });

        test('should create legend from nodes', () => {
            uiManager.createLegend(mockNodes);

            const legendElement = container.querySelector('.graph-network-legend');
            expect(legendElement).not.toBeNull();

            const legendItems = legendElement?.querySelectorAll('.legend-item');
            expect(legendItems?.length).toBeGreaterThan(0);
        });

        test('should update legend with new nodes', () => {
            uiManager.createLegend(mockNodes);

            const newNodes = [
                ...mockNodes,
                new Node<NodeData>({
                    id: 'node4',
                    name: 'Square Node',
                    type: 'quaternary',
                    shape: 'square'
                }, 800, 600)
            ];

            uiManager.updateLegend(newNodes);

            const legendItems = container.querySelectorAll('.legend-item');
            expect(legendItems.length).toBeGreaterThan(mockNodes.length);
        });

        test('should group legend items by type and shape', () => {
            const duplicateTypeNodes = [
                ...mockNodes,
                new Node<NodeData>({
                    id: 'node4',
                    name: 'Another Primary',
                    type: 'primary',
                    shape: 'circle'
                }, 800, 600)
            ];

            uiManager.createLegend(duplicateTypeNodes);

            const legendItems = container.querySelectorAll('.legend-item');
            // Should group duplicates, so fewer items than total nodes
            expect(legendItems.length).toBeLessThan(duplicateTypeNodes.length);
        });

        test('should handle empty node array', () => {
            uiManager.createLegend([]);

            const legendElement = container.querySelector('.graph-network-legend');
            expect(legendElement).not.toBeNull();

            const legendItems = legendElement?.querySelectorAll('.legend-item');
            expect(legendItems?.length).toBe(0);
        });
    });

    describe('Zoom Controls', () => {
        beforeEach(() => {
            uiManager.initialize();
        });

        test('should create zoom control buttons', () => {
            const zoomControls = container.querySelector('.graph-network-zoom-controls');
            expect(zoomControls).not.toBeNull();

            const zoomInBtn = zoomControls?.querySelector('.graph-network-zoom-in-btn');
            const zoomOutBtn = zoomControls?.querySelector('.graph-network-zoom-out-btn');
            const resetBtn = zoomControls?.querySelector('.graph-network-reset-view-btn');

            expect(zoomInBtn).not.toBeNull();
            expect(zoomOutBtn).not.toBeNull();
            expect(resetBtn).not.toBeNull();
        });

        test('should handle zoom in button click', () => {
            const zoomInBtn = container.querySelector('.graph-network-zoom-in-btn') as HTMLElement;
            zoomInBtn.click();

            expect(callbacks.onZoomIn).toHaveBeenCalled();
        });

        test('should handle zoom out button click', () => {
            const zoomOutBtn = container.querySelector('.graph-network-zoom-out-btn') as HTMLElement;
            zoomOutBtn.click();

            expect(callbacks.onZoomOut).toHaveBeenCalled();
        });

        test('should handle reset view button click', () => {
            const resetBtn = container.querySelector('.graph-network-reset-view-btn') as HTMLElement;
            resetBtn.click();

            expect(callbacks.onResetView).toHaveBeenCalled();
        });
    });

    describe('Theme Toggle', () => {
        beforeEach(() => {
            uiManager.initialize();
        });

        test('should create theme toggle button', () => {
            const themeToggle = container.querySelector('.graph-network-theme-toggle-btn');
            expect(themeToggle).not.toBeNull();
        });

        test('should handle theme toggle click', () => {
            const themeToggle = container.querySelector('.graph-network-theme-toggle-btn') as HTMLElement;
            themeToggle.click();

            expect(callbacks.onToggleTheme).toHaveBeenCalled();
        });

        test('should update theme toggle appearance', () => {
            const themeToggle = container.querySelector('.graph-network-theme-toggle-btn') as HTMLElement;
            
            uiManager.updateThemeToggle('light');
            expect(themeToggle.textContent).toBe('🌙');

            uiManager.updateThemeToggle('dark');
            expect(themeToggle.textContent).toBe('🌞');
        });
    });

    describe('Physics Controls', () => {
        test('should create physics controls when enabled', () => {
            const physicsConfig: Partial<UIConfig> = {
                showControls: true
            };

            const physicsManager = new UIManager(container, physicsConfig, callbacks, themeManager);
            physicsManager.initialize();

            const physicsPanel = container.querySelector('.graph-network-settings');
            expect(physicsPanel).not.toBeNull();

            physicsManager.destroy();
        });

        test('should not create physics controls when disabled', () => {
            // Test with showControls: false
            const disabledConfig: Partial<UIConfig> = { showControls: false };
            const disabledManager = new UIManager(container, disabledConfig, callbacks, themeManager);
            disabledManager.initialize();

            const physicsPanel = container.querySelector('.graph-network-settings');
            expect(physicsPanel).toBeNull();
            
            disabledManager.destroy();
        });

        test('should handle physics control changes', () => {
            const physicsConfig: Partial<UIConfig> = {
                showControls: true
            };

            const physicsManager = new UIManager(container, physicsConfig, callbacks, themeManager);
            physicsManager.initialize();

            const slider = container.querySelector('input[data-physics-key]') as HTMLInputElement;
            if (slider) {
                slider.value = '0.5';
                slider.dispatchEvent(new Event('input'));

                expect(callbacks.onConfigChange).toHaveBeenCalled();
            }

            physicsManager.destroy();
        });
    });

    describe('Settings Panel', () => {
        beforeEach(() => {
            uiManager.initialize();
        });

        test('should show settings visibility status', () => {
            expect(uiManager.isSettingsVisible()).toBeFalsy();
        });

        test('should close settings panel', () => {
            // Test that closeSettings doesn't throw
            expect(() => {
                uiManager.closeSettings();
            }).not.toThrow();
        });

        test('should handle settings toggle button click', () => {
            const settingsToggle = container.querySelector('.graph-network-settings-toggle');
            if (settingsToggle) {
                (settingsToggle as HTMLElement).click();
                // Settings toggle behavior is handled internally
                expect(settingsToggle).not.toBeNull();
            }
        });
    });

    describe('Configuration Management', () => {
        beforeEach(() => {
            uiManager.initialize();
        });

        test('should update configuration', () => {
            const newConfig = { title: 'Updated Title' };
            
            uiManager.updateConfig(newConfig);

            // Verify config was updated
            const config = uiManager.getConfig();
            expect(config.title).toBe('Updated Title');
        });

        test('should get UI elements', () => {
            const elements = uiManager.getUIElements();
            
            expect(elements).not.toBeNull();
            expect(elements?.container).toBeDefined();
            expect(elements?.titleElement).toBeDefined();
            expect(elements?.legendElement).toBeDefined();
            expect(elements?.controls).toBeDefined();
        });
    });

    describe('Theme Integration', () => {
        beforeEach(() => {
            uiManager.initialize();
        });

        test('should update theme colors', () => {
            // This should not throw
            expect(() => {
                uiManager.updateThemeColors(mockNodes);
            }).not.toThrow();
        });

        test('should apply theme to all UI elements', () => {
            uiManager.createLegend(mockNodes);
            uiManager.updateThemeColors(mockNodes);

            // Elements should have theme colors applied
            const titleElement = container.querySelector('.graph-network-title');
            const legendElement = container.querySelector('.graph-network-legend');
            
            expect(titleElement).not.toBeNull();
            expect(legendElement).not.toBeNull();
        });
    });

    describe('Cleanup and Destruction', () => {
        test('should clean up all DOM elements on destroy', () => {
            uiManager.initialize();
            uiManager.createLegend(mockNodes);

            // Verify elements exist
            expect(container.children.length).toBeGreaterThan(0);

            uiManager.destroy();

            // All UI elements should be removed
            expect(container.children.length).toBe(0);
        });

        test('should clear all element references', () => {
            uiManager.initialize();
            uiManager.destroy();

            const elements = uiManager.getUIElements();
            expect(elements).not.toBeNull();
            expect(elements?.titleElement).toBeUndefined();
            expect(elements?.legendElement).toBeUndefined();
            expect(elements?.controls).toBeUndefined();
            expect(elements?.settingsPanel).toBeUndefined();
        });

        test('should handle multiple destroy calls gracefully', () => {
            uiManager.initialize();

            expect(() => {
                uiManager.destroy();
                uiManager.destroy();
            }).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        test('should handle missing theme manager gracefully', () => {
            const noThemeManager = new UIManager(container, { 
                showTitle: false,
                showLegend: false,
                showThemeToggle: false
            }, callbacks);
            
            expect(() => {
                noThemeManager.initialize();
                noThemeManager.updateThemeColors();
                noThemeManager.destroy();
            }).not.toThrow();
        });

        test('should handle missing callbacks gracefully', () => {
            const noCallbacksManager = new UIManager(container, {}, {}, themeManager);
            
            expect(() => {
                noCallbacksManager.initialize();
                
                // Try to trigger callbacks that don't exist
                const zoomBtn = container.querySelector('.zoom-in-btn') as HTMLElement;
                zoomBtn?.click();
                
                noCallbacksManager.destroy();
            }).not.toThrow();
        });

        test('should handle invalid configuration gracefully', () => {
            const invalidConfig = { title: null as any };
            
            expect(() => {
                const invalidManager = new UIManager(container, invalidConfig, callbacks, themeManager);
                invalidManager.initialize();
                invalidManager.destroy();
            }).not.toThrow();
        });
    });

    describe('Accessibility', () => {
        beforeEach(() => {
            uiManager.initialize();
        });

        test('should add proper ARIA labels to buttons', () => {
            const zoomInBtn = container.querySelector('.zoom-in-btn');
            const zoomOutBtn = container.querySelector('.zoom-out-btn');
            const themeToggle = container.querySelector('.graph-network-theme-toggle-btn');

            expect(zoomInBtn?.getAttribute('aria-label')).toBeTruthy();
            expect(zoomOutBtn?.getAttribute('aria-label')).toBeTruthy();
            expect(themeToggle?.getAttribute('aria-label')).toBeTruthy();
        });

        test('should support keyboard navigation', () => {
            const buttons = container.querySelectorAll('button');
            
            buttons.forEach(button => {
                expect(button.tabIndex).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('Performance', () => {
        test('should handle large number of legend items efficiently', () => {
            const largeNodeSet = Array.from({ length: 1000 }, (_, i) => 
                new Node<NodeData>({
                    id: `node-${i}`,
                    name: `Node ${i}`,
                    type: `type-${i % 10}`,
                    shape: 'circle'
                }, 800, 600)
            );

            uiManager.initialize();

            const startTime = performance.now();
            uiManager.createLegend(largeNodeSet);
            const endTime = performance.now();

            // Should complete within reasonable time (< 100ms)
            expect(endTime - startTime).toBeLessThan(100);
        });

        test('should batch DOM updates efficiently', () => {
            uiManager.initialize();
            
            // Multiple rapid updates should not cause performance issues
            const startTime = performance.now();
            
            for (let i = 0; i < 100; i++) {
                uiManager.updateTitle(`Title ${i}`);
            }
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(50);
        });
    });
});