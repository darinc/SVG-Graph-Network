// Import the library for development
import GraphNetwork from '../src/index.js';

// Make it available globally
window.GraphNetwork = GraphNetwork;

console.log('Advanced example loaded');

// Initialize the graph when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple initializations (for HMR)
    if (window.graph) {
        try {
            window.graph.destroy();
        } catch (e) {
            console.log('Previous graph instance cleanup skipped');
        }
    }
    // Historical diplomatic network data from 1914
    const diplomaticNetworkData = {
        nodes: [
            // Major Powers
            { id: "germany", name: "German Empire", type: "major_power", shape: "rectangle", size: 50 },
            { id: "britain", name: "British Empire", type: "major_power", shape: "rectangle", size: 45 },
            { id: "france", name: "French Republic", type: "major_power", shape: "rectangle", size: 40 },
            { id: "russia", name: "Russian Empire", type: "major_power", shape: "rectangle", size: 45 },
            { id: "austria-hungary", name: "Austria-Hungary", type: "major_power", shape: "rectangle", size: 35 },
            
            // Regional Powers
            { id: "ottoman", name: "Ottoman Empire", type: "regional_power", shape: "rectangle", size: 30 },
            { id: "italy", name: "Kingdom of Italy", type: "regional_power", shape: "rectangle", size: 25 },
            { id: "serbia", name: "Kingdom of Serbia", type: "regional_power", shape: "rectangle", size: 20 },
            
            // Smaller Nations
            { id: "belgium", name: "Belgium", type: "small_nation", shape: "rectangle", size: 15 },
            { id: "bulgaria", name: "Bulgaria", type: "small_nation", shape: "rectangle", size: 18 },
            { id: "romania", name: "Romania", type: "small_nation", shape: "rectangle", size: 20 },
            { id: "montenegro", name: "Montenegro", type: "small_nation", shape: "rectangle", size: 12 },
            
            // Key Regions/Issues
            { id: "alsace-lorraine", name: "Alsace-Lorraine", type: "territory", shape: "rectangle", size: 25 },
            { id: "balkans", name: "Balkan Peninsula", type: "territory", shape: "rectangle", size: 30 },
            { id: "morocco", name: "Morocco", type: "territory", shape: "rectangle", size: 20 }
        ],
        links: [
            // Triple Alliance
            { source: "germany", target: "austria-hungary", label: "Triple Alliance", weight: 5, line_type: 'solid' },
            { source: "germany", target: "italy", label: "Triple Alliance", weight: 4, line_type: 'solid' },
            { source: "austria-hungary", target: "italy", label: "Triple Alliance", weight: 3, line_type: 'solid' },
            
            // Triple Entente
            { source: "france", target: "russia", label: "Franco-Russian Alliance", weight: 5, line_type: 'solid' },
            { source: "britain", target: "france", label: "Entente Cordiale", weight: 4, line_type: 'solid' },
            { source: "britain", target: "russia", label: "Anglo-Russian Entente", weight: 3, line_type: 'solid' },
            
            // Tensions and Rivalries
            { source: "germany", target: "france", label: "mutual hostility", weight: 4, line_type: 'dashed' },
            { source: "austria-hungary", target: "serbia", label: "annexation crisis", weight: 5, line_type: 'dashed' },
            { source: "russia", target: "austria-hungary", label: "Balkan rivalry", weight: 4, line_type: 'dashed' },
            { source: "germany", target: "britain", label: "naval arms race", weight: 3, line_type: 'dashed' },
            
            // Territorial Disputes
            { source: "france", target: "alsace-lorraine", label: "claims", weight: 5, line_type: 'dotted' },
            { source: "germany", target: "alsace-lorraine", label: "controls", weight: 5, line_type: 'solid' },
            { source: "russia", target: "balkans", label: "influence", weight: 4, line_type: 'dotted' },
            { source: "austria-hungary", target: "balkans", label: "controls", weight: 5, line_type: 'solid' },
            { source: "serbia", target: "balkans", label: "expansion", weight: 4, line_type: 'dotted' },
            
            // Colonial Rivalries
            { source: "germany", target: "morocco", label: "challenges", weight: 3, line_type: 'dashed' },
            { source: "france", target: "morocco", label: "protectorate", weight: 4, line_type: 'solid' },
            { source: "britain", target: "france", label: "supports in Morocco", weight: 2, line_type: 'dotted' },
            
            // Balkan Connections
            { source: "russia", target: "serbia", label: "Pan-Slavic support", weight: 4, line_type: 'solid' },
            { source: "serbia", target: "montenegro", label: "Slavic alliance", weight: 3, line_type: 'solid' },
            { source: "bulgaria", target: "austria-hungary", label: "alignment", weight: 2, line_type: 'dotted' },
            { source: "romania", target: "austria-hungary", label: "secret treaty", weight: 3, line_type: 'dotted' },
            
            // Guarantee and Protection
            { source: "britain", target: "belgium", label: "neutrality guarantee", weight: 4, line_type: 'solid' },
            { source: "germany", target: "ottoman", label: "military mission", weight: 3, line_type: 'dotted' }
        ]
    };

    // Initialize the advanced graph with full features
    const graph = new GraphNetwork('graph-container', {
        data: diplomaticNetworkData,
        config: {
            title: 'European Diplomatic Network 1914',
            theme: 'dark',
            showControls: true,
            showLegend: true,
            showTitle: true,
            showBreadcrumbs: true,
            damping: 0.95,
            repulsionStrength: 6500,
            attractionStrength: 0.001,
            filterDepth: 2
        }
    });

    // Event listeners for advanced interactions
    graph.on('nodeDoubleClick', (data) => {
        console.log(`Filtering by ${data.node.data.name}`);
    });

    graph.on('filtered', (data) => {
        console.log(`Graph filtered by ${data.nodeId}, showing ${data.visibleNodes.length} nodes`);
    });

    graph.on('filterReset', () => {
        console.log('Showing all nodes');
    });

    graph.on('themeChanged', (data) => {
        console.log(`Theme changed to ${data.theme}`);
    });

    graph.on('zoom', (data) => {
        console.log(`Zoomed to ${data.scale.toFixed(2)}x`);
    });

    // Make graph available globally
    window.graph = graph;

    // Start the simulation
    console.log('European Diplomatic Network 1914 loaded');
    console.log('- Double-click nodes to explore their relationships');
    console.log('- Use controls to adjust physics parameters');
    console.log('- Pan with mouse drag, zoom with wheel');
});