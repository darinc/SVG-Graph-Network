// Import the library for development
import GraphNetwork from '../src/index.js';

// Make it available globally
window.GraphNetwork = GraphNetwork;

console.log('Basic example loaded');

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
    // Simple graph data
    const graphData = {
        nodes: [
            { id: "A", name: "Node A", type: "primary", shape: "rectangle", size: 30 },
            { id: "B", name: "Node B", type: "secondary", shape: "rectangle", size: 25 },
            { id: "C", name: "Node C", type: "tertiary", shape: "rectangle", size: 20 },
            { id: "D", name: "Node D", type: "tertiary", shape: "rectangle", size: 20 },
            { id: "E", name: "Node E", type: "auxiliary", shape: "rectangle", size: 18 },
            { id: "F", name: "Node F", type: "auxiliary", shape: "rectangle", size: 18 }
        ],
        links: [
            { source: "A", target: "B", label: "connected to", weight: 3, line_type: "solid" },
            { source: "A", target: "C", label: "linked with", weight: 2, line_type: "solid" },
            { source: "B", target: "C", label: "related to", weight: 2, line_type: "dotted" },
            { source: "B", target: "D", label: "competes with", weight: 2, line_type: "dashed" },
            { source: "C", target: "E", label: "influences", weight: 1, line_type: "dotted" },
            { source: "D", target: "F", label: "manages", weight: 2, line_type: "solid" },
            { source: "A", target: "F", label: "conflicts with", weight: 1, line_type: "dashed" }
        ]
    };

    // Initialize the graph
    const graph = new GraphNetwork('graph-container', {
        data: graphData,
        config: {
            showTitle: false,
            theme: 'light',
            showLegend: true
        }
    });

    // Event listeners
    graph.on('nodeDoubleClick', (data) => {
        console.log('Node double clicked:', data.node.data.name);
    });

    graph.on('filtered', (data) => {
        console.log('Graph filtered by node:', data.nodeId);
    });

    graph.on('filterReset', () => {
        console.log('Filter reset');
    });

    graph.on('themeChanged', (data) => {
        console.log('Theme changed to:', data.theme);
    });
    
    // Make graph available globally for button controls
    window.graph = graph;
    
    console.log('Graph initialized successfully!');
});