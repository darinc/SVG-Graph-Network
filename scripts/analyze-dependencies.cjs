#!/usr/bin/env node

/**
 * Module Dependency Analyzer
 *
 * Analyzes TypeScript files in the src directory to build a dependency graph
 * showing import relationships between modules. Outputs data suitable for
 * visualization with the SVG-Graph-Network library.
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const OUTPUT_FILE = path.join(__dirname, '../docs/assets/modules-data.json');

/**
 * Extract import statements from TypeScript file content
 */
function extractImports(content, filePath) {
    const imports = [];

    // Match various import patterns
    const importPatterns = [
        // import { ... } from '...'
        /import\s*\{[^}]*\}\s*from\s*['"`]([^'"`]+)['"`]/g,
        // import ... from '...'
        /import\s+\w+\s*from\s*['"`]([^'"`]+)['"`]/g,
        // import * as ... from '...'
        /import\s*\*\s*as\s+\w+\s*from\s*['"`]([^'"`]+)['"`]/g,
        // import '...'
        /import\s*['"`]([^'"`]+)['"`]/g
    ];

    for (const pattern of importPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const importPath = match[1];

            // Skip external dependencies (don't start with . or /)
            if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
                continue;
            }

            // Resolve relative imports
            let resolvedPath = path.resolve(path.dirname(filePath), importPath);

            // Add .ts extension if not present
            if (!resolvedPath.endsWith('.ts') && !resolvedPath.endsWith('.js')) {
                if (fs.existsSync(resolvedPath + '.ts')) {
                    resolvedPath += '.ts';
                } else if (fs.existsSync(path.join(resolvedPath, 'index.ts'))) {
                    resolvedPath = path.join(resolvedPath, 'index.ts');
                }
            }

            // Convert to relative path from src
            const relativePath = path.relative(SRC_DIR, resolvedPath);
            if (relativePath && !relativePath.startsWith('..')) {
                imports.push(relativePath);
            }
        }
    }

    return [...new Set(imports)]; // Remove duplicates
}

/**
 * Get module category based on file path
 */
function getModuleCategory(filePath) {
    const pathParts = filePath.split(path.sep);

    if (pathParts.includes('core')) return 'core';
    if (pathParts.includes('rendering')) return 'rendering';
    if (pathParts.includes('physics')) return 'physics';
    if (pathParts.includes('interaction')) return 'interaction';
    if (pathParts.includes('ui')) return 'ui';
    if (pathParts.includes('events')) return 'events';
    if (pathParts.includes('highlighting')) return 'highlighting';
    if (pathParts.includes('selection')) return 'selection';
    if (pathParts.includes('styling')) return 'styling';
    if (pathParts.includes('theming')) return 'theming';
    if (pathParts.includes('camera')) return 'camera';
    if (pathParts.includes('utils')) return 'utils';
    if (pathParts.includes('types')) return 'types';
    if (pathParts.includes('errors')) return 'errors';

    // Root files
    if (filePath.includes('GraphNetwork')) return 'main';
    if (filePath.includes('Node') || filePath.includes('Vector')) return 'foundation';
    if (filePath.includes('index')) return 'entry';

    return 'other';
}

/**
 * Calculate file metrics
 */
function getFileMetrics(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').length;
        const size = fs.statSync(filePath).size;

        // Count exports
        const exportMatches = content.match(/^export\s/gm) || [];
        const exports = exportMatches.length;

        // Count classes, interfaces, functions
        const classes = (content.match(/class\s+\w+/g) || []).length;
        const interfaces = (content.match(/interface\s+\w+/g) || []).length;
        const functions = (content.match(/function\s+\w+/g) || []).length;

        return { lines, size, exports, classes, interfaces, functions };
    } catch (error) {
        return { lines: 0, size: 0, exports: 0, classes: 0, interfaces: 0, functions: 0 };
    }
}

/**
 * Get module color based on category
 */
function getCategoryColor(category) {
    const colors = {
        main: '#FF6B6B',        // Red - GraphNetwork
        foundation: '#4ECDC4',   // Teal - Node, Vector
        core: '#45B7D1',        // Blue - Core functionality
        rendering: '#96CEB4',    // Green - Rendering system
        physics: '#FFEAA7',     // Yellow - Physics
        interaction: '#DDA0DD',  // Plum - User interaction
        ui: '#FFB6C1',          // Light pink - UI components
        events: '#87CEEB',      // Sky blue - Events
        highlighting: '#F0E68C', // Khaki - Highlighting
        selection: '#DEB887',   // Burlywood - Selection
        styling: '#FFE4E1',     // Misty rose - Styling
        theming: '#E6E6FA',     // Lavender - Theming
        camera: '#98FB98',      // Pale green - Camera
        utils: '#D3D3D3',       // Light gray - Utilities
        types: '#C0C0C0',       // Silver - Type definitions
        errors: '#FFA07A',      // Light salmon - Errors
        entry: '#DA70D6',       // Orchid - Entry points
        other: '#F5F5F5'        // White smoke - Other
    };

    return colors[category] || colors.other;
}

/**
 * Recursively find all TypeScript files
 */
function findTSFiles(dir, files = []) {
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            findTSFiles(fullPath, files);
        } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Main analysis function
 */
function analyzeDependencies() {
    console.log('🔍 Analyzing TypeScript module dependencies...');

    // Find all TypeScript files
    const tsFiles = findTSFiles(SRC_DIR);
    console.log(`📁 Found ${tsFiles.length} TypeScript files`);

    const nodes = [];
    const edges = [];
    const modules = new Map();

    // First pass: create nodes
    for (const filePath of tsFiles) {
        const relativePath = path.relative(SRC_DIR, filePath);
        const category = getModuleCategory(relativePath);
        const metrics = getFileMetrics(filePath);

        const node = {
            id: relativePath,
            label: path.basename(relativePath, '.ts'),
            category,
            color: getCategoryColor(category),
            size: Math.max(20, Math.min(60, metrics.lines / 5)), // Size based on lines of code
            path: relativePath,
            fullPath: filePath,
            metrics
        };

        nodes.push(node);
        modules.set(relativePath, node);
    }

    // Second pass: create edges (import relationships)
    for (const filePath of tsFiles) {
        const relativePath = path.relative(SRC_DIR, filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        const imports = extractImports(content, filePath);

        for (const importPath of imports) {
            if (modules.has(importPath)) {
                edges.push({
                    id: `${relativePath}->${importPath}`,
                    source: relativePath,
                    target: importPath,
                    type: 'import'
                });
            }
        }
    }

    // Calculate statistics
    const stats = {
        totalModules: nodes.length,
        totalDependencies: edges.length,
        categories: {},
        topImported: [],
        circularDependencies: []
    };

    // Count by category
    for (const node of nodes) {
        stats.categories[node.category] = (stats.categories[node.category] || 0) + 1;
    }

    // Find most imported modules
    const importCounts = new Map();
    for (const edge of edges) {
        importCounts.set(edge.target, (importCounts.get(edge.target) || 0) + 1);
    }

    stats.topImported = Array.from(importCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([module, count]) => ({ module, count }));

    // Simple circular dependency detection (would need more sophisticated algorithm for complex cycles)
    const visited = new Set();
    const visiting = new Set();

    function hasCycle(nodeId) {
        if (visiting.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;

        visiting.add(nodeId);

        for (const edge of edges) {
            if (edge.source === nodeId && hasCycle(edge.target)) {
                stats.circularDependencies.push(`${nodeId} -> ${edge.target}`);
                return true;
            }
        }

        visiting.delete(nodeId);
        visited.add(nodeId);
        return false;
    }

    for (const node of nodes) {
        hasCycle(node.id);
    }

    const result = {
        metadata: {
            generatedAt: new Date().toISOString(),
            sourceDirectory: 'src/',
            totalFiles: tsFiles.length,
            analyzer: 'analyze-dependencies.js'
        },
        stats,
        nodes,
        edges
    };

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));

    console.log('✅ Analysis complete!');
    console.log(`📊 Generated data for ${nodes.length} modules and ${edges.length} dependencies`);
    console.log(`💾 Output saved to: ${OUTPUT_FILE}`);
    console.log(`📈 Statistics:`);
    console.log(`   - Categories: ${Object.keys(stats.categories).length}`);
    console.log(`   - Most imported: ${stats.topImported[0]?.module} (${stats.topImported[0]?.count} imports)`);
    console.log(`   - Potential circular deps: ${stats.circularDependencies.length}`);

    return result;
}

// Run if called directly
if (require.main === module) {
    try {
        analyzeDependencies();
    } catch (error) {
        console.error('❌ Error analyzing dependencies:', error);
        process.exit(1);
    }
}

module.exports = { analyzeDependencies };