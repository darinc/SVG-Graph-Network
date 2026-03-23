/**
 * Theme type definitions extracted from ThemeManager to break circular
 * dependency between ThemeManager and AutoColorGenerator.
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
        highlighted?: StateStyles;
    };
}

export type VisualState = 'normal' | 'hover' | 'selected' | 'active' | 'disabled' | 'highlighted';
