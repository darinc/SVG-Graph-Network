import { NodeStyleConfig } from './ThemeManager';

/**
 * Configuration for automatic color generation
 */
export interface AutoColorConfig {
    enabled: boolean;
    saturation: number;
    lightness: number;
    algorithm: 'golden-ratio' | 'predefined-palette';
}

/**
 * AutoColorGenerator - Automatically generates visually distinct colors for node types
 *
 * Uses the golden ratio method to ensure maximum perceptual distinction between colors.
 * Colors are generated deterministically - the same node type will always receive the same color.
 *
 * @example
 * ```typescript
 * const generator = new AutoColorGenerator();
 * const style = generator.generateColorForType('database', 'dark');
 * // Returns: { fill: 'hsl(222, 65%, 40%)', stroke: 'hsl(222, 75%, 20%)', ... }
 * ```
 */
export class AutoColorGenerator {
    private typeIndexMap = new Map<string, number>();
    private nextIndex = 0;
    private config: AutoColorConfig;

    /**
     * Creates a new AutoColorGenerator
     * @param config - Optional configuration for color generation
     */
    constructor(config: Partial<AutoColorConfig> = {}) {
        this.config = {
            enabled: true,
            saturation: 65,
            lightness: 50,
            algorithm: 'golden-ratio',
            ...config
        };
    }

    /**
     * Generate a color style for a specific node type
     * @param nodeType - The type of node to generate colors for
     * @param themeName - The current theme name (affects color adjustments)
     * @returns NodeStyleConfig with fill, stroke, strokeWidth, and opacity
     */
    generateColorForType(nodeType: string, themeName: string): NodeStyleConfig {
        if (!this.typeIndexMap.has(nodeType)) {
            this.typeIndexMap.set(nodeType, this.nextIndex++);
        }

        const index = this.typeIndexMap.get(nodeType)!;

        if (this.config.algorithm === 'golden-ratio') {
            return this.goldenRatioColor(index, themeName);
        } else {
            return this.predefinedPaletteColor(index, themeName);
        }
    }

    /**
     * Generate colors using the golden ratio method
     * Provides maximum perceptual distinction using HSL color space
     * @private
     */
    private goldenRatioColor(index: number, themeName: string): NodeStyleConfig {
        // Golden ratio conjugate for even hue distribution
        const goldenRatio = 0.618033988749895;
        const hue = (index * goldenRatio * 360) % 360;

        // Theme-aware adjustments
        const isDark = themeName === 'dark' || themeName === 'default';
        const isMinimal = themeName === 'minimal';

        let saturation = this.config.saturation;
        let lightness = this.config.lightness;

        // Adjust for dark themes - slightly darker and more saturated
        if (isDark) {
            lightness = Math.max(40, lightness - 10);
            saturation = Math.min(80, saturation + 5);
        } else {
            // Light theme - brighter and less saturated
            lightness = Math.min(70, lightness + 10);
            saturation = Math.max(45, saturation - 5);
        }

        // Minimal theme - reduce saturation
        if (isMinimal) {
            saturation -= 15;
        }

        return {
            fill: `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`,
            stroke: `hsl(${Math.round(hue)}, ${saturation + 10}%, ${lightness - 20}%)`,
            strokeWidth: 2,
            opacity: 1
        };
    }

    /**
     * Generate colors from a predefined palette
     * Cycles through a curated set of colors for variety
     * @private
     */
    private predefinedPaletteColor(index: number, themeName: string): NodeStyleConfig {
        // Curated color palettes for different themes
        const palettes = {
            dark: [
                { fill: '#8b5cf6', stroke: '#7c3aed' }, // Purple
                { fill: '#ec4899', stroke: '#db2777' }, // Pink
                { fill: '#14b8a6', stroke: '#0d9488' }, // Teal
                { fill: '#f59e0b', stroke: '#d97706' }, // Amber
                { fill: '#06b6d4', stroke: '#0891b2' }, // Cyan
                { fill: '#84cc16', stroke: '#65a30d' }, // Lime
                { fill: '#ef4444', stroke: '#dc2626' }, // Red
                { fill: '#3b82f6', stroke: '#2563eb' }, // Blue
                { fill: '#10b981', stroke: '#059669' }, // Emerald
                { fill: '#f97316', stroke: '#ea580c' } // Orange
            ],
            light: [
                { fill: '#c4b5fd', stroke: '#8b5cf6' }, // Light purple
                { fill: '#fbcfe8', stroke: '#ec4899' }, // Light pink
                { fill: '#99f6e4', stroke: '#14b8a6' }, // Light teal
                { fill: '#fde68a', stroke: '#f59e0b' }, // Light amber
                { fill: '#a5f3fc', stroke: '#06b6d4' }, // Light cyan
                { fill: '#d9f99d', stroke: '#84cc16' }, // Light lime
                { fill: '#fca5a5', stroke: '#ef4444' }, // Light red
                { fill: '#93c5fd', stroke: '#3b82f6' }, // Light blue
                { fill: '#6ee7b7', stroke: '#10b981' }, // Light emerald
                { fill: '#fdba74', stroke: '#f97316' } // Light orange
            ]
        };

        const isDark = themeName === 'dark' || themeName === 'default';
        const palette = isDark ? palettes.dark : palettes.light;
        const color = palette[index % palette.length];

        return {
            ...color,
            strokeWidth: 2,
            opacity: 1
        };
    }

    /**
     * Reset the generator, clearing all type-to-index mappings
     * Useful when changing themes or restarting color assignments
     */
    reset(): void {
        this.typeIndexMap.clear();
        this.nextIndex = 0;
    }

    /**
     * Get the number of unique types that have been assigned colors
     */
    getAssignedTypeCount(): number {
        return this.typeIndexMap.size;
    }

    /**
     * Check if a type has been assigned a color
     */
    hasType(nodeType: string): boolean {
        return this.typeIndexMap.has(nodeType);
    }

    /**
     * Get all assigned node types
     */
    getAssignedTypes(): string[] {
        return Array.from(this.typeIndexMap.keys());
    }
}
