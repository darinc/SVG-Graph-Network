// Import the library for development
import GraphNetwork from '../src/index.ts';

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
    
    // Add theme testing functionality - available in browser console
    window.testThemes = function() {
        console.log('Available themes:', graph.getAvailableThemes());
        
        // Test switching to different themes
        setTimeout(() => {
            console.log('Switching to dark theme...');
            graph.setTheme('dark');
        }, 2000);
        
        setTimeout(() => {
            console.log('Switching to minimal theme...');
            graph.setTheme('minimal');
        }, 4000);
        
        setTimeout(() => {
            console.log('Switching back to light theme...');
            graph.setTheme('light');
        }, 6000);
    };
    
    // Test custom node styling
    window.testCustomStyling = function() {
        // Customize the primary node style
        graph.setNodeTypeStyle('primary', {
            fill: '#ff6b6b',
            stroke: '#ff5252',
            strokeWidth: 3,
            opacity: 1
        });
        
        // Customize secondary nodes
        graph.setNodeTypeStyle('secondary', {
            fill: '#4ecdc4',
            stroke: '#26a69a',
            strokeWidth: 2,
            opacity: 1
        });
        
        console.log('Custom node styling applied!');
    };
    
    // Test visual states
    window.testStates = function() {
        // Set some nodes to different visual states
        graph.setElementState('A', 'hover', true);
        setTimeout(() => graph.setElementState('B', 'selected', true), 1000);
        setTimeout(() => graph.setElementState('C', 'active', true), 2000);
        setTimeout(() => {
            // Reset all states
            graph.setElementState('A', 'hover', false);
            graph.setElementState('B', 'selected', false);
            graph.setElementState('C', 'active', false);
        }, 4000);
        
        console.log('Testing visual states...');
    };
    
    console.log('Graph initialized successfully!');
    console.log('Try these functions in the browser console:');
    console.log('- testThemes() - Test switching between themes');
    console.log('- testCustomStyling() - Test custom node styling');
    console.log('- testStates() - Test visual states');
    console.log('- graph.getCurrentTheme() - Get current theme info');
});