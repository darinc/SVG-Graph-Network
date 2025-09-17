// Use the globally available SVGGraphNetwork from the dual-mode script loading
// No imports needed - the library is loaded via script tag

console.log('Basic example loaded');

// Initialize the graph when both DOM and library are ready
function initializeWhenReady() {
    console.log('Checking for SVGGraphNetwork...', typeof SVGGraphNetwork);
    if (typeof SVGGraphNetwork !== 'undefined') {
        console.log('SVGGraphNetwork found, initializing graph...');
        initializeGraph();
    } else {
        console.log('SVGGraphNetwork not ready, waiting...');
        // Wait a bit and try again
        setTimeout(initializeWhenReady, 100);
    }
}

function initializeGraph() {
    console.log('Starting graph initialization...');

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
    window.graph = new SVGGraphNetwork('graph-container', {
        data: graphData,
        config: {
            showTitle: false,
            theme: 'light',
            showLegend: true
        }
    });

    // Event listeners
    window.graph.on('nodeDoubleClick', (data) => {
        console.log('Node double clicked:', data.node.data.name);
    });

    window.graph.on('filtered', (data) => {
        console.log('Graph filtered by node:', data.nodeId);
    });

    window.graph.on('filterReset', () => {
        console.log('Filter reset');
    });

    window.graph.on('themeChanged', (data) => {
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
            window.graph.setTheme('dark');
        }, 2000);
        
        setTimeout(() => {
            console.log('Switching to minimal theme...');
            window.graph.setTheme('minimal');
        }, 4000);
        
        setTimeout(() => {
            console.log('Switching back to light theme...');
            window.graph.setTheme('light');
        }, 6000);
    };
    
    // Test custom node styling
    window.testCustomStyling = function() {
        // Customize the primary node style
        window.graph.setNodeTypeStyle('primary', {
            fill: '#ff6b6b',
            stroke: '#ff5252',
            strokeWidth: 3,
            opacity: 1
        });
        
        // Customize secondary nodes
        window.graph.setNodeTypeStyle('secondary', {
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
        window.graph.setElementState('A', 'hover', true);
        setTimeout(() => graph.setElementState('B', 'selected', true), 1000);
        setTimeout(() => graph.setElementState('C', 'active', true), 2000);
        setTimeout(() => {
            // Reset all states
            window.graph.setElementState('A', 'hover', false);
            window.graph.setElementState('B', 'selected', false);
            window.graph.setElementState('C', 'active', false);
        }, 4000);
        
        console.log('Testing visual states...');
    };
    
    // Add random node functionality
    window.addRandomNode = function() {
        const nodeTypes = ['primary', 'secondary', 'tertiary', 'auxiliary'];
        const shapes = ['rectangle', 'circle', 'square'];
        const currentData = graph.getData();
        
        // Generate a new unique node ID
        const existingIds = currentData.nodes.map(n => n.id);
        let newId;
        let counter = 1;
        do {
            newId = `Node_${counter}`;
            counter++;
        } while (existingIds.includes(newId));
        
        // Create new node with random properties
        const randomType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        const randomSize = Math.floor(Math.random() * 15) + 15; // Size between 15-30
        
        const newNode = {
            id: newId,
            name: newId.replace('_', ' '),
            type: randomType,
            shape: randomShape,
            size: randomSize
        };
        
        // Add the node to the graph
        window.graph.addNode(newNode);
        
        // Connect to 1-3 random existing nodes
        const numConnections = Math.floor(Math.random() * 3) + 1;
        const connectionLabels = ['connected to', 'linked with', 'related to', 'influences', 'manages'];
        const lineTypes = ['solid', 'dotted', 'dashed'];
        
        for (let i = 0; i < numConnections; i++) {
            const randomExistingNode = existingIds[Math.floor(Math.random() * existingIds.length)];
            const randomLabel = connectionLabels[Math.floor(Math.random() * connectionLabels.length)];
            const randomLineType = lineTypes[Math.floor(Math.random() * lineTypes.length)];
            const randomWeight = Math.floor(Math.random() * 3) + 1;
            
            // Avoid duplicate connections
            const existingLinks = graph.getData().links;
            const linkExists = existingLinks.some(link => 
                (link.source === newId && link.target === randomExistingNode) ||
                (link.source === randomExistingNode && link.target === newId)
            );
            
            if (!linkExists) {
                window.graph.addLink({
                    source: newId,
                    target: randomExistingNode,
                    label: randomLabel,
                    weight: randomWeight,
                    line_type: randomLineType
                });
            }
        }
        
        console.log(`Added node: ${newId} with ${numConnections} connections`);
    };
    
    // Delete random node functionality
    window.deleteRandomNode = function() {
        const currentData = graph.getData();
        
        if (currentData.nodes.length <= 2) {
            console.log('Cannot delete more nodes - minimum of 2 nodes required');
            return;
        }
        
        // Pick a random node to delete (excluding first two to keep some base structure)
        const deletableNodes = currentData.nodes.slice(2); // Keep at least first 2 nodes
        if (deletableNodes.length === 0) {
            console.log('No deletable nodes available');
            return;
        }
        
        const randomNode = deletableNodes[Math.floor(Math.random() * deletableNodes.length)];
        
        // Find all connected edges
        const connectedEdges = currentData.links.filter(link => 
            link.source === randomNode.id || link.target === randomNode.id
        );
        
        // Remove all connected edges first
        connectedEdges.forEach(edge => {
            // Create a unique edge ID for removal
            const edgeId = `${edge.source}-${edge.target}`;
            try {
                window.graph.removeLink(edgeId);
            } catch (e) {
                // Edge might already be removed, continue
                console.log(`Edge ${edgeId} already removed or not found`);
            }
        });
        
        // Remove the node
        window.graph.removeNode(randomNode.id);
        
        console.log(`Deleted node: ${randomNode.id} and ${connectedEdges.length} connected edges`);
    };

    console.log('Graph initialized successfully!');
    console.log('Try these functions in the browser console:');
    console.log('- testThemes() - Test switching between themes');
    console.log('- testCustomStyling() - Test custom node styling');
    console.log('- testStates() - Test visual states');
    console.log('- graph.getCurrentTheme() - Get current theme info');
    console.log('- addRandomNode() - Add a random node with connections');
    console.log('- deleteRandomNode() - Delete a random node and its edges');
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initializeWhenReady);