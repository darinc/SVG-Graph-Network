// Halfviz-style interactive graph demo
console.log('Halfviz demo loaded');

let graph;
let graphInput;
let parseTimeoutId;
let currentData = { nodes: [], links: [] };

// Initialize when ready
function initializeWhenReady() {
    console.log('Checking for SVGGraphNetwork...', typeof SVGGraphNetwork);
    if (typeof SVGGraphNetwork !== 'undefined') {
        console.log('SVGGraphNetwork found, initializing halfviz demo...');
        initHalfviz();
    } else {
        console.log('SVGGraphNetwork not ready, waiting...');
        setTimeout(initializeWhenReady, 100);
    }
}

function initHalfviz() {
    console.log('Starting halfviz initialization...');

    // Prevent multiple initializations
    if (window.graph) {
        try {
            window.graph.destroy();
        } catch (e) {
            console.log('Previous graph instance cleanup skipped');
        }
    }

    // Get input element
    graphInput = document.getElementById('graph-input');

    // Initialize the graph with halfviz-style config
    // Start with a simple node to avoid empty data error
    const initialData = {
        nodes: [
            { id: 'welcome', name: 'Start typing...', type: 'default', size: 20, shape: 'circle' }
        ],
        links: []
    };

    window.graph = new SVGGraphNetwork('graph-container', {
        data: initialData,
        config: {
            showTitle: false,
            theme: 'dark',
            showLegend: false,
            physics: {
                enabled: true,
                springLength: 50,
                springStrength: 0.08,
                damping: 0.3,
                repulsion: 2600,
                gravity: 0.1,
                centralGravity: 0.05,
                timestep: 0.02
            },
            interaction: {
                dragNodes: true,
                panCanvas: true,
                zoomCanvas: true,
                selectNodes: false
            },
            canvas: {
                background: '#1a1a1a',
                padding: 50
            },
            nodes: {
                defaultSize: 20,
                defaultColor: '#4a9',
                borderWidth: 2,
                borderColor: '#2a7a6a',
                labelColor: '#f0f0f0',
                labelSize: 11,
                labelFont: 'Fira Code, Monaco, monospace'
            },
            edges: {
                defaultColor: '#666',
                defaultWidth: 1,
                labelColor: '#888',
                labelSize: 9,
                labelFont: 'Fira Code, Monaco, monospace'
            }
        }
    });

    graph = window.graph;

    // Set up real-time parsing
    graphInput.addEventListener('input', handleInputChange);
    graphInput.addEventListener('keydown', handleKeyDown);

    // Load initial example
    loadExample();

    // Update physics display values
    updatePhysicsDisplay();

    console.log('Halfviz demo initialized successfully!');
}

// Handle input changes with debouncing
function handleInputChange() {
    clearTimeout(parseTimeoutId);
    parseTimeoutId = setTimeout(parseAndUpdateGraph, 300);
}

// Handle special key combinations
function handleKeyDown(event) {
    if (event.ctrlKey || event.metaKey) {
        if (event.key === 'Enter') {
            event.preventDefault();
            parseAndUpdateGraph();
        }
    }
}

// Parse the input text and update the graph
function parseAndUpdateGraph() {
    const input = graphInput.value;
    const errorElement = document.getElementById('error-message');

    try {
        const parsedData = parseGraphDefinition(input);
        currentData = parsedData;

        // Update the graph
        graph.setData(parsedData, {
            duration: 500,
            preservePositions: true
        });

        // Update statistics
        updateStatistics();

        // Hide error message
        errorElement.style.display = 'none';
    } catch (error) {
        console.error('Parse error:', error);
        errorElement.textContent = error.message;
        errorElement.style.display = 'block';
    }
}

// Parse graph definition text into nodes and links
function parseGraphDefinition(text) {
    const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'));
    const nodes = new Map();
    const links = [];
    const nodeProps = new Map();

    // First pass: collect all node names and properties
    for (const line of lines) {
        // Check for node with properties: NodeA{prop:value,prop2:value2}
        const nodePropsMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*\{([^}]+)\}$/);
        if (nodePropsMatch) {
            const [, nodeName, propsStr] = nodePropsMatch;
            addNode(nodes, nodeName);
            nodeProps.set(nodeName, parseNodeProperties(propsStr));
            continue;
        }

        // Check for connections with more flexible parsing
        // Handle bidirectional with label: NodeA <-label-> NodeB
        const bidirectionalLabelMatch = line.match(
            /^([A-Za-z_][A-Za-z0-9_-]*)\s*<-([^-]+)->\s*([A-Za-z_][A-Za-z0-9_-]*)$/
        );
        if (bidirectionalLabelMatch) {
            const [, sourceNode, label, targetNode] = bidirectionalLabelMatch;
            addNode(nodes, sourceNode);
            addNode(nodes, targetNode);

            const linkLabel = label ? label.trim() : '';
            // Bidirectional connection
            links.push({
                source: sourceNode,
                target: targetNode,
                label: linkLabel,
                weight: 1,
                line_type: 'solid'
            });
            links.push({
                source: targetNode,
                target: sourceNode,
                label: linkLabel,
                weight: 1,
                line_type: 'solid'
            });
            continue;
        }

        // Handle simple bidirectional: NodeA <-> NodeB
        const simpleBidirectionalMatch = line.match(
            /^([A-Za-z_][A-Za-z0-9_-]*)\s*<->\s*([A-Za-z_][A-Za-z0-9_-]*)$/
        );
        if (simpleBidirectionalMatch) {
            const [, sourceNode, targetNode] = simpleBidirectionalMatch;
            addNode(nodes, sourceNode);
            addNode(nodes, targetNode);

            // Bidirectional connection
            links.push({
                source: sourceNode,
                target: targetNode,
                label: '',
                weight: 1,
                line_type: 'solid'
            });
            links.push({
                source: targetNode,
                target: sourceNode,
                label: '',
                weight: 1,
                line_type: 'solid'
            });
            continue;
        }

        // Handle right arrow with label: NodeA -label-> NodeB
        const rightArrowLabelMatch = line.match(
            /^([A-Za-z_][A-Za-z0-9_-]*)\s*-([^-]+)->\s*([A-Za-z_][A-Za-z0-9_-]*)$/
        );
        if (rightArrowLabelMatch) {
            const [, sourceNode, label, targetNode] = rightArrowLabelMatch;
            addNode(nodes, sourceNode);
            addNode(nodes, targetNode);

            const linkLabel = label ? label.trim() : '';
            links.push({
                source: sourceNode,
                target: targetNode,
                label: linkLabel,
                weight: 1,
                line_type: 'solid'
            });
            continue;
        }

        // Handle simple right arrow: NodeA -> NodeB
        const simpleRightArrowMatch = line.match(
            /^([A-Za-z_][A-Za-z0-9_-]*)\s*->\s*([A-Za-z_][A-Za-z0-9_-]*)$/
        );
        if (simpleRightArrowMatch) {
            const [, sourceNode, targetNode] = simpleRightArrowMatch;
            addNode(nodes, sourceNode);
            addNode(nodes, targetNode);

            links.push({
                source: sourceNode,
                target: targetNode,
                label: '',
                weight: 1,
                line_type: 'solid'
            });
            continue;
        }

        // Handle left arrow with label: NodeA <-label- NodeB
        const leftArrowLabelMatch = line.match(
            /^([A-Za-z_][A-Za-z0-9_-]*)\s*<-([^-]+)-\s*([A-Za-z_][A-Za-z0-9_-]*)$/
        );
        if (leftArrowLabelMatch) {
            const [, targetNode, label, sourceNode] = leftArrowLabelMatch;
            addNode(nodes, sourceNode);
            addNode(nodes, targetNode);

            const linkLabel = label ? label.trim() : '';
            links.push({
                source: sourceNode,
                target: targetNode,
                label: linkLabel,
                weight: 1,
                line_type: 'solid'
            });
            continue;
        }

        // Handle simple left arrow: NodeA <- NodeB
        const simpleLeftArrowMatch = line.match(
            /^([A-Za-z_][A-Za-z0-9_-]*)\s*<-\s*([A-Za-z_][A-Za-z0-9_-]*)$/
        );
        if (simpleLeftArrowMatch) {
            const [, targetNode, sourceNode] = simpleLeftArrowMatch;
            addNode(nodes, sourceNode);
            addNode(nodes, targetNode);

            links.push({
                source: sourceNode,
                target: targetNode,
                label: '',
                weight: 1,
                line_type: 'solid'
            });
            continue;
        }

        // Simple node declaration
        const nodeMatch = line.match(/^[A-Za-z_][A-Za-z0-9_-]*$/);
        if (nodeMatch) {
            addNode(nodes, line);
            continue;
        }

        // If we get here, the line couldn't be parsed
        if (line.length > 0) {
            throw new Error(`Cannot parse line: "${line}"`);
        }
    }

    // Convert nodes map to array with properties
    const nodeArray = Array.from(nodes.values()).map(node => {
        const props = nodeProps.get(node.id) || {};

        // Map common property names to SVGGraphNetwork format
        const mappedProps = { ...props };

        // Map 'color' to appropriate style fields
        if (props.color) {
            mappedProps.fill = props.color;
            mappedProps.stroke = props.color;
            delete mappedProps.color; // Remove the original to avoid confusion
        }

        return {
            ...node,
            ...mappedProps
        };
    });

    return { nodes: nodeArray, links };
}

// Add a node to the nodes map
function addNode(nodes, nodeName) {
    if (!nodes.has(nodeName)) {
        nodes.set(nodeName, {
            id: nodeName,
            name: nodeName,
            type: 'default',
            size: 20,
            shape: 'circle'
        });
    }
}

// Parse node properties string
function parseNodeProperties(propsStr) {
    const props = {};
    const pairs = propsStr.split(',').map(pair => pair.trim());

    for (const pair of pairs) {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
            // Handle different value types
            if (value.startsWith('#')) {
                // Color value
                props[key] = value;
            } else if (!isNaN(value)) {
                // Numeric value
                props[key] = parseFloat(value);
            } else {
                // String value (remove quotes if present)
                props[key] = value.replace(/^['"]|['"]$/g, '');
            }
        }
    }

    return props;
}

// Update statistics display
function updateStatistics() {
    document.getElementById('node-count').textContent = currentData.nodes.length;
    document.getElementById('edge-count').textContent = currentData.links.length;

    // Calculate connected components (simplified)
    const components = calculateComponents(currentData);
    document.getElementById('component-count').textContent = components;
}

// Calculate number of connected components
function calculateComponents(data) {
    if (data.nodes.length === 0) return 0;

    const visited = new Set();
    const adjacencyList = new Map();

    // Build adjacency list
    data.nodes.forEach(node => adjacencyList.set(node.id, new Set()));
    data.links.forEach(link => {
        if (adjacencyList.has(link.source) && adjacencyList.has(link.target)) {
            adjacencyList.get(link.source).add(link.target);
            adjacencyList.get(link.target).add(link.source);
        }
    });

    let componentCount = 0;

    function dfs(nodeId) {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const neighbors = adjacencyList.get(nodeId) || new Set();
        neighbors.forEach(neighbor => dfs(neighbor));
    }

    data.nodes.forEach(node => {
        if (!visited.has(node.id)) {
            dfs(node.id);
            componentCount++;
        }
    });

    return componentCount;
}

// Update physics parameter display
function updatePhysicsDisplay() {
    if (!graph) return;

    const config = graph.getConfig();
    const physics = config.physics || {};

    document.getElementById('spring-tension').textContent = Math.round(
        (physics.springStrength || 0.08) * 6400
    );
    document.getElementById('node-repulsion').textContent = Math.round(
        physics.repulsion || 2600
    ).toLocaleString();
    document.getElementById('friction').textContent =
        Math.round((1 - (physics.damping || 0.3)) * 100) + '%';
    document.getElementById('gravity').textContent = physics.centralGravity > 0 ? 'Center' : 'None';
}

// Control functions
function clearGraph() {
    graphInput.value = '';
    // Keep a placeholder node to avoid empty data error
    currentData = {
        nodes: [
            { id: 'welcome', name: 'Start typing...', type: 'default', size: 20, shape: 'circle' }
        ],
        links: []
    };
    graph.setData(currentData);
    updateStatistics();
    document.getElementById('error-message').style.display = 'none';
}

function loadExample() {
    const exampleText = `// Star Wars: A New Hope - Character Relationships
Luke
Leia
Han
Vader
Obi-Wan
Tarkin
C-3PO
R2-D2

// Main character connections
Luke -> Leia
Luke -> Han
Luke -> Obi-Wan
Luke -> Vader
Han -> Leia
Obi-Wan -> Vader
Vader -> Tarkin

// Droid connections
Luke -> R2-D2
Leia -> R2-D2
C-3PO <-> R2-D2

// Empire connections
Vader -> Tarkin
Tarkin -> Leia

// Force connections
Obi-Wan -teaches-> Luke
Vader <-father- Luke`;

    graphInput.value = exampleText;
    parseAndUpdateGraph();
}

function exportData() {
    const jsonData = JSON.stringify(currentData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Make functions globally available
window.initHalfviz = initHalfviz;
window.clearGraph = clearGraph;
window.loadExample = loadExample;
window.exportData = exportData;

// Start initialization when DOM is ready, but only if SVGGraphNetwork is already loaded
document.addEventListener('DOMContentLoaded', function () {
    if (typeof SVGGraphNetwork !== 'undefined') {
        initializeWhenReady();
    }
    // If not loaded, the script onload handler will call initHalfviz()
});
