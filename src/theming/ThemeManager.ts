/**
 * ThemeManager - Core theming system for flexible visual customization
 *
 * Provides centralized theme management with support for:
 * - Dynamic node/edge type styling
 * - Visual state management
 * - Runtime theme switching
 * - User customization
 */

export interface NodeStyleConfig {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    strokeDasharray?: string;
    filter?: string;
    [attribute: string]: any;
}

export interface EdgeStyleConfig {
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    strokeDasharray?: string;
    markerEnd?: string;
    filter?: string;
    [attribute: string]: any;
}

export interface CanvasConfig {
    background?: string;
    showGrid?: boolean;
    gridColor?: string;
    gridSize?: number;
    gridOpacity?: number;
    gridStyle?: 'lines' | 'dots' | 'crosses';
    syncBackgroundTransform?: boolean;
}

export interface StateStyles {
    nodes?: NodeStyleConfig;
    edges?: EdgeStyleConfig;
}

export interface ColorScheme {
    primary?: string;
    secondary?: string;
    background?: string;
    foreground?: string;
    hover?: string;
    selected?: string;
    disabled?: string;
    [key: string]: string | undefined;
}

export interface ThemeConfig {
    name: string;
    version?: string;

    // Canvas styling
    canvas?: CanvasConfig;

    // Color scheme
    colors?: ColorScheme;

    // Node styles by type (fully dynamic)
    nodeStyles?: {
        default?: NodeStyleConfig;
        [nodeType: string]: NodeStyleConfig | undefined;
    };

    // Edge styles by type
    edgeStyles?: {
        default?: EdgeStyleConfig;
        [edgeType: string]: EdgeStyleConfig | undefined;
    };

    // Visual states
    states?: {
        normal?: StateStyles;
        hover?: StateStyles;
        selected?: StateStyles;
        active?: StateStyles;
        disabled?: StateStyles;
    };
}

export type VisualState = 'normal' | 'hover' | 'selected' | 'active' | 'disabled';

export class ThemeManager {
    private currentTheme: ThemeConfig;
    private registeredThemes = new Map<string, ThemeConfig>();
    private elementStates = new Map<string, Set<VisualState>>();

    constructor(initialTheme?: ThemeConfig) {
        this.currentTheme = initialTheme || this.getDefaultTheme();
        this.registerBuiltinThemes();
    }

    /**
     * Get the default minimal theme
     */
    private getDefaultTheme(): ThemeConfig {
        return {
            name: 'default',
            canvas: {
                background: '#1a1a1a',
                showGrid: true,
                gridColor: 'rgba(255, 165, 0, 0.1)',
                gridSize: 30,
                gridOpacity: 0.1,
                syncBackgroundTransform: true
            },
            colors: {
                primary: '#3b82f6',
                secondary: '#64748b',
                background: '#1a1a1a',
                foreground: '#f8fafc',
                hover: '#60a5fa',
                selected: '#2563eb',
                disabled: '#374151'
            },
            nodeStyles: {
                default: {
                    fill: '#64748b',
                    stroke: '#94a3b8',
                    strokeWidth: 2,
                    opacity: 1
                },
                primary: {
                    fill: '#ef4444',
                    stroke: '#dc2626',
                    strokeWidth: 2,
                    opacity: 1
                },
                secondary: {
                    fill: '#3b82f6',
                    stroke: '#2563eb',
                    strokeWidth: 2,
                    opacity: 1
                },
                tertiary: {
                    fill: '#10b981',
                    stroke: '#059669',
                    strokeWidth: 2,
                    opacity: 1
                },
                auxiliary: {
                    fill: '#f59e0b',
                    stroke: '#d97706',
                    strokeWidth: 2,
                    opacity: 1
                },
                // Legacy types for advanced example
                major_power: {
                    fill: '#ef4444',
                    stroke: '#dc2626',
                    strokeWidth: 3,
                    opacity: 1
                },
                regional_power: {
                    fill: '#3b82f6',
                    stroke: '#2563eb',
                    strokeWidth: 2,
                    opacity: 1
                },
                small_nation: {
                    fill: '#10b981',
                    stroke: '#059669',
                    strokeWidth: 2,
                    opacity: 1
                }
            },
            edgeStyles: {
                default: {
                    stroke: '#64748b',
                    strokeWidth: 1,
                    opacity: 0.8
                }
            },
            states: {
                hover: {
                    nodes: {
                        stroke: '#60a5fa',
                        strokeWidth: 3
                    }
                },
                selected: {
                    nodes: {
                        stroke: '#2563eb',
                        strokeWidth: 4
                    }
                },
                disabled: {
                    nodes: {
                        opacity: 0.3,
                        filter: 'grayscale(100%)'
                    },
                    edges: {
                        opacity: 0.3,
                        filter: 'grayscale(100%)'
                    }
                }
            }
        };
    }

    /**
     * Get a minimal theme with basic styling
     */
    private getMinimalTheme(): ThemeConfig {
        return {
            name: 'minimal',
            canvas: {
                background: '#ffffff',
                showGrid: false,
                syncBackgroundTransform: true
            },
            colors: {
                primary: '#000000',
                secondary: '#666666',
                background: '#ffffff',
                foreground: '#000000',
                hover: '#333333',
                selected: '#000000',
                disabled: '#cccccc'
            },
            nodeStyles: {
                default: {
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeWidth: 1,
                    opacity: 1
                },
                primary: {
                    fill: '#fca5a5',
                    stroke: '#ef4444',
                    strokeWidth: 2,
                    opacity: 1
                },
                secondary: {
                    fill: '#93c5fd',
                    stroke: '#3b82f6',
                    strokeWidth: 2,
                    opacity: 1
                },
                tertiary: {
                    fill: '#6ee7b7',
                    stroke: '#10b981',
                    strokeWidth: 2,
                    opacity: 1
                },
                auxiliary: {
                    fill: '#fbbf24',
                    stroke: '#f59e0b',
                    strokeWidth: 2,
                    opacity: 1
                },
                // Legacy types for advanced example
                major_power: {
                    fill: '#fca5a5',
                    stroke: '#ef4444',
                    strokeWidth: 3,
                    opacity: 1
                },
                regional_power: {
                    fill: '#93c5fd',
                    stroke: '#3b82f6',
                    strokeWidth: 2,
                    opacity: 1
                },
                small_nation: {
                    fill: '#6ee7b7',
                    stroke: '#10b981',
                    strokeWidth: 2,
                    opacity: 1
                }
            },
            edgeStyles: {
                default: {
                    stroke: '#666666',
                    strokeWidth: 1,
                    opacity: 1
                }
            },
            states: {
                hover: {
                    nodes: {
                        stroke: '#333333',
                        strokeWidth: 2
                    }
                },
                selected: {
                    nodes: {
                        stroke: '#000000',
                        strokeWidth: 2
                    }
                }
            }
        };
    }

    /**
     * Get a dark theme
     */
    private getDarkTheme(): ThemeConfig {
        return {
            name: 'dark',
            canvas: {
                background: '#0f0f0f',
                showGrid: true,
                gridColor: 'rgba(255, 165, 0, 0.1)',
                gridSize: 30,
                gridOpacity: 0.1,
                syncBackgroundTransform: true
            },
            colors: {
                primary: '#60a5fa',
                secondary: '#94a3b8',
                background: '#0f0f0f',
                foreground: '#f8fafc',
                hover: '#93c5fd',
                selected: '#3b82f6',
                disabled: '#374151'
            },
            nodeStyles: {
                default: {
                    fill: '#1f2937',
                    stroke: '#6b7280',
                    strokeWidth: 2,
                    opacity: 1
                },
                primary: {
                    fill: '#dc2626',
                    stroke: '#b91c1c',
                    strokeWidth: 2,
                    opacity: 1
                },
                secondary: {
                    fill: '#2563eb',
                    stroke: '#1d4ed8',
                    strokeWidth: 2,
                    opacity: 1
                },
                tertiary: {
                    fill: '#059669',
                    stroke: '#047857',
                    strokeWidth: 2,
                    opacity: 1
                },
                auxiliary: {
                    fill: '#d97706',
                    stroke: '#b45309',
                    strokeWidth: 2,
                    opacity: 1
                },
                // Legacy types for advanced example
                major_power: {
                    fill: '#dc2626',
                    stroke: '#b91c1c',
                    strokeWidth: 3,
                    opacity: 1
                },
                regional_power: {
                    fill: '#2563eb',
                    stroke: '#1d4ed8',
                    strokeWidth: 2,
                    opacity: 1
                },
                small_nation: {
                    fill: '#059669',
                    stroke: '#047857',
                    strokeWidth: 2,
                    opacity: 1
                }
            },
            edgeStyles: {
                default: {
                    stroke: '#6b7280',
                    strokeWidth: 1,
                    opacity: 0.8
                }
            },
            states: {
                hover: {
                    nodes: {
                        stroke: '#93c5fd',
                        strokeWidth: 3,
                        fill: '#374151'
                    },
                    edges: {
                        stroke: '#93c5fd',
                        opacity: 1
                    }
                },
                selected: {
                    nodes: {
                        stroke: '#3b82f6',
                        strokeWidth: 4,
                        fill: '#1e3a8a'
                    },
                    edges: {
                        stroke: '#3b82f6',
                        opacity: 1
                    }
                },
                disabled: {
                    nodes: {
                        opacity: 0.3,
                        filter: 'grayscale(100%)'
                    },
                    edges: {
                        opacity: 0.3,
                        filter: 'grayscale(100%)'
                    }
                }
            }
        };
    }

    /**
     * Get a light theme
     */
    private getLightTheme(): ThemeConfig {
        return {
            name: 'light',
            canvas: {
                background: '#ffffff',
                showGrid: true,
                gridColor: 'rgba(0, 100, 255, 0.1)',
                gridSize: 30,
                gridOpacity: 0.1,
                syncBackgroundTransform: true
            },
            colors: {
                primary: '#2563eb',
                secondary: '#64748b',
                background: '#ffffff',
                foreground: '#1e293b',
                hover: '#3b82f6',
                selected: '#1d4ed8',
                disabled: '#d1d5db'
            },
            nodeStyles: {
                default: {
                    fill: '#f8fafc',
                    stroke: '#64748b',
                    strokeWidth: 2,
                    opacity: 1
                },
                primary: {
                    fill: '#fee2e2',
                    stroke: '#ef4444',
                    strokeWidth: 2,
                    opacity: 1
                },
                secondary: {
                    fill: '#dbeafe',
                    stroke: '#3b82f6',
                    strokeWidth: 2,
                    opacity: 1
                },
                tertiary: {
                    fill: '#d1fae5',
                    stroke: '#10b981',
                    strokeWidth: 2,
                    opacity: 1
                },
                auxiliary: {
                    fill: '#fef3c7',
                    stroke: '#f59e0b',
                    strokeWidth: 2,
                    opacity: 1
                },
                // Legacy types for advanced example
                major_power: {
                    fill: '#fee2e2',
                    stroke: '#ef4444',
                    strokeWidth: 3,
                    opacity: 1
                },
                regional_power: {
                    fill: '#dbeafe',
                    stroke: '#3b82f6',
                    strokeWidth: 2,
                    opacity: 1
                },
                small_nation: {
                    fill: '#d1fae5',
                    stroke: '#10b981',
                    strokeWidth: 2,
                    opacity: 1
                }
            },
            edgeStyles: {
                default: {
                    stroke: '#64748b',
                    strokeWidth: 1,
                    opacity: 0.8
                }
            },
            states: {
                hover: {
                    nodes: {
                        stroke: '#3b82f6',
                        strokeWidth: 3,
                        fill: '#e0f2fe'
                    },
                    edges: {
                        stroke: '#3b82f6',
                        opacity: 1
                    }
                },
                selected: {
                    nodes: {
                        stroke: '#1d4ed8',
                        strokeWidth: 4,
                        fill: '#dbeafe'
                    },
                    edges: {
                        stroke: '#1d4ed8',
                        opacity: 1
                    }
                },
                disabled: {
                    nodes: {
                        opacity: 0.4,
                        filter: 'grayscale(80%)'
                    },
                    edges: {
                        opacity: 0.4,
                        filter: 'grayscale(80%)'
                    }
                }
            }
        };
    }

    /**
     * Register built-in themes
     */
    private registerBuiltinThemes(): void {
        this.registeredThemes.set('default', this.getDefaultTheme());
        this.registeredThemes.set('minimal', this.getMinimalTheme());
        this.registeredThemes.set('dark', this.getDarkTheme());
        this.registeredThemes.set('light', this.getLightTheme());
    }

    /**
     * Set the current theme
     */
    setTheme(theme: string | ThemeConfig): void {
        if (typeof theme === 'string') {
            const registeredTheme = this.registeredThemes.get(theme);
            if (!registeredTheme) {
                throw new Error(
                    `Theme '${theme}' not found. Available themes: ${Array.from(this.registeredThemes.keys()).join(', ')}`
                );
            }
            this.currentTheme = registeredTheme;
        } else {
            this.currentTheme = theme;
        }
    }

    /**
     * Get the current theme
     */
    getCurrentTheme(): ThemeConfig {
        return this.currentTheme;
    }

    /**
     * Register a new theme
     */
    registerTheme(name: string, theme: ThemeConfig): void {
        this.registeredThemes.set(name, { ...theme, name });
    }

    /**
     * Get node styles for a specific type and states
     */
    getNodeStyle(
        nodeType: string,
        states: Set<VisualState> = new Set(['normal'])
    ): NodeStyleConfig {
        let style: NodeStyleConfig = {};

        // Start with default styles
        if (this.currentTheme.nodeStyles?.default) {
            style = { ...this.currentTheme.nodeStyles.default };
        }

        // Apply type-specific styles
        if (nodeType && this.currentTheme.nodeStyles?.[nodeType]) {
            style = { ...style, ...this.currentTheme.nodeStyles[nodeType] };
        }

        // Apply state styles (in priority order)
        const stateOrder: VisualState[] = ['normal', 'hover', 'active', 'selected', 'disabled'];
        for (const state of stateOrder) {
            if (states.has(state) && this.currentTheme.states?.[state]?.nodes) {
                style = { ...style, ...this.currentTheme.states[state]!.nodes };
            }
        }

        return style;
    }

    /**
     * Get edge styles for a specific type and states
     */
    getEdgeStyle(
        edgeType: string,
        states: Set<VisualState> = new Set(['normal'])
    ): EdgeStyleConfig {
        let style: EdgeStyleConfig = {};

        // Start with default styles
        if (this.currentTheme.edgeStyles?.default) {
            style = { ...this.currentTheme.edgeStyles.default };
        }

        // Apply type-specific styles
        if (edgeType && this.currentTheme.edgeStyles?.[edgeType]) {
            style = { ...style, ...this.currentTheme.edgeStyles[edgeType] };
        }

        // Apply state styles
        const stateOrder: VisualState[] = ['normal', 'hover', 'active', 'selected', 'disabled'];
        for (const state of stateOrder) {
            if (states.has(state) && this.currentTheme.states?.[state]?.edges) {
                style = { ...style, ...this.currentTheme.states[state]!.edges };
            }
        }

        return style;
    }

    /**
     * Get canvas configuration
     */
    getCanvasConfig(): CanvasConfig {
        return this.currentTheme.canvas || {};
    }

    /**
     * Get color from the color scheme
     */
    getColor(colorKey: string): string | undefined {
        return this.currentTheme.colors?.[colorKey];
    }

    /**
     * Set element state
     */
    setElementState(elementId: string, state: VisualState, enabled: boolean): void {
        if (!this.elementStates.has(elementId)) {
            this.elementStates.set(elementId, new Set(['normal']));
        }

        const states = this.elementStates.get(elementId)!;

        if (enabled) {
            states.add(state);
            // Remove normal state when other states are active
            if (state !== 'normal') {
                states.delete('normal');
            }
        } else {
            states.delete(state);
            // Add normal state if no other states are active
            if (states.size === 0) {
                states.add('normal');
            }
        }
    }

    /**
     * Get element states
     */
    getElementStates(elementId: string): Set<VisualState> {
        return this.elementStates.get(elementId) || new Set(['normal']);
    }

    /**
     * Clear all element states
     */
    clearElementStates(): void {
        this.elementStates.clear();
    }

    /**
     * Update theme partially
     */
    updateTheme(updates: Partial<ThemeConfig>): void {
        this.currentTheme = {
            ...this.currentTheme,
            ...updates,
            // Deep merge for nested objects
            canvas: updates.canvas
                ? { ...this.currentTheme.canvas, ...updates.canvas }
                : this.currentTheme.canvas,
            colors: updates.colors
                ? { ...this.currentTheme.colors, ...updates.colors }
                : this.currentTheme.colors,
            nodeStyles: updates.nodeStyles
                ? { ...this.currentTheme.nodeStyles, ...updates.nodeStyles }
                : this.currentTheme.nodeStyles,
            edgeStyles: updates.edgeStyles
                ? { ...this.currentTheme.edgeStyles, ...updates.edgeStyles }
                : this.currentTheme.edgeStyles,
            states: updates.states
                ? { ...this.currentTheme.states, ...updates.states }
                : this.currentTheme.states
        };
    }

    /**
     * Set styles for a specific node type
     */
    setNodeStyle(nodeType: string, style: NodeStyleConfig): void {
        if (!this.currentTheme.nodeStyles) {
            this.currentTheme.nodeStyles = {};
        }
        this.currentTheme.nodeStyles[nodeType] = {
            ...this.currentTheme.nodeStyles[nodeType],
            ...style
        };
    }

    /**
     * Set styles for a specific edge type
     */
    setEdgeStyle(edgeType: string, style: EdgeStyleConfig): void {
        if (!this.currentTheme.edgeStyles) {
            this.currentTheme.edgeStyles = {};
        }
        this.currentTheme.edgeStyles[edgeType] = {
            ...this.currentTheme.edgeStyles[edgeType],
            ...style
        };
    }

    /**
     * Get list of available themes
     */
    getAvailableThemes(): string[] {
        return Array.from(this.registeredThemes.keys());
    }

    /**
     * Configure grid settings for current theme
     */
    configureGrid(options: {
        enabled?: boolean;
        color?: string;
        size?: number;
        opacity?: number;
    }): void {
        if (!this.currentTheme.canvas) {
            this.currentTheme.canvas = {};
        }

        if (options.enabled !== undefined) {
            this.currentTheme.canvas.showGrid = options.enabled;
        }
        if (options.color !== undefined) {
            this.currentTheme.canvas.gridColor = options.color;
        }
        if (options.size !== undefined) {
            this.currentTheme.canvas.gridSize = options.size;
        }
        if (options.opacity !== undefined) {
            this.currentTheme.canvas.gridOpacity = options.opacity;
        }

        // Note: Grid changes will be applied when applyCanvasTheming() is called
        // No need to trigger theme change callback here as it's just a grid config change
    }

    /**
     * Get current grid configuration
     */
    getGridConfig(): {
        enabled: boolean;
        color?: string;
        size?: number;
        opacity?: number;
    } {
        const canvas = this.currentTheme.canvas || {};
        return {
            enabled: canvas.showGrid ?? false,
            color: canvas.gridColor,
            size: canvas.gridSize,
            opacity: canvas.gridOpacity
        };
    }
}
