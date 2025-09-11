# SVG Graph Network

An interactive SVG graph visualization library with force-directed layout and physics simulation. Create beautiful, interactive network diagrams with customizable nodes, links, and physics parameters.

## Features

- 🎯 **Force-directed layout** with customizable physics simulation
- 🎨 **Interactive controls** for pan, zoom, drag, and filter
- 🎛️ **Real-time configuration** with sliders for all physics parameters  
- 🌓 **Theme support** (dark/light modes)
- 📱 **Responsive design** that works on all screen sizes
- 🔍 **Node filtering** to focus on specific parts of the network
- 📊 **Multiple node shapes** (circle, rectangle, square, triangle)
- 🔗 **Flexible link styling** (solid, dashed, dotted lines)
- 🎪 **Event system** for custom interactions
- 📦 **Zero dependencies** - pure JavaScript and SVG

## Demo

🌐 [Live Demo](https://yourusername.github.io/svg-graph-network/)

## Installation

### NPM
```bash
npm install svg-graph-network
```

### CDN
```html
<script src="https://unpkg.com/svg-graph-network/dist/svg-graph-network.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/svg-graph-network/dist/svg-graph-network.css">
```

### Download
Download the latest release from [GitHub Releases](https://github.com/yourusername/svg-graph-network/releases)

## Quick Start

### HTML
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="path/to/svg-graph-network.css">
</head>
<body>
    <div id="graph-container" style="width: 800px; height: 600px;"></div>
    <script src="path/to/svg-graph-network.js"></script>
</body>
</html>
```

### JavaScript
```javascript
const graphData = {
    nodes: [
        { id: "A", name: "Node A", type: "major_power", shape: "rectangle", size: 30 },
        { id: "B", name: "Node B", type: "regional_power", shape: "circle", size: 25 },
        { id: "C", name: "Node C", type: "small_nation", shape: "square", size: 20 }
    ],
    links: [
        { source: "A", target: "B", label: "alliance", weight: 3, line_type: "solid" },
        { source: "B", target: "C", label: "trade", weight: 2, line_type: "dashed" }
    ]
};

const graph = new GraphNetwork('graph-container', {
    data: graphData,
    config: {
        theme: 'dark',
        showControls: true,
        showLegend: true
    }
});
```

## API Reference

### Constructor

```javascript
new GraphNetwork(containerId, options)
```

#### Parameters
- `containerId` (string): ID of the HTML container element
- `options` (object): Configuration options

#### Options
```javascript
{
    data: {
        nodes: [...],  // Array of node objects
        links: [...]   // Array of link objects
    },
    config: {
        // Physics
        damping: 0.95,                    // Velocity damping (0.35 - 1.0)
        repulsionStrength: 6500,          // Node repulsion force
        attractionStrength: 0.001,        // Link attraction force
        groupingStrength: 0.001,          // Same-type node grouping force
        
        // Interaction
        zoomSensitivity: 1.01,            // Mouse wheel zoom sensitivity
        filterDepth: 1,                   // Default filter depth
        
        // UI Elements
        showControls: true,               // Show control buttons
        showLegend: true,                 // Show legend
        showTitle: true,                  // Show title
        showBreadcrumbs: true,            // Show breadcrumb navigation
        
        // Appearance
        theme: 'dark',                    // 'dark' or 'light'
        title: 'Graph Network'            // Graph title
    }
}
```

### Data Format

#### Node Object
```javascript
{
    id: "unique-id",           // Required: Unique identifier
    name: "Display Name",      // Required: Display text
    type: "major_power",       // Node type for styling/grouping
    shape: "rectangle",        // "circle", "rectangle", "square", "triangle"
    size: 30                   // Radius/size in pixels
}
```

#### Link Object
```javascript
{
    source: "node-id-1",       // Required: Source node ID
    target: "node-id-2",       // Required: Target node ID
    label: "relationship",     // Display text on the link
    weight: 3,                 // Line thickness
    line_type: "solid"         // "solid", "dashed", "dotted"
}
```

### Methods

#### Data Management
```javascript
// Set new graph data
graph.setData(graphData);

// Add a single node
graph.addNode({
    id: "new-node",
    name: "New Node",
    type: "small_nation",
    shape: "circle",
    size: 20
});

// Remove a node
graph.removeNode("node-id");

// Get node by ID
const node = graph.getNode("node-id");

// Get all nodes
const nodes = graph.getNodes();

// Get all links  
const links = graph.getLinks();
```

#### View Control
```javascript
// Reset layout and view
graph.resetViewAndLayout();

// Fit graph to container
graph.fitToView();

// Filter by node (show only neighbors)
graph.filterByNode("node-id", depth);

// Reset filter (show all nodes)
graph.resetFilter();
```

#### Appearance
```javascript
// Set theme
graph.setTheme('light'); // or 'dark'

// Toggle theme
graph.toggleTheme();
```

#### Cleanup
```javascript
// Destroy the graph and clean up
graph.destroy();
```

### Events

The library provides an event system for custom interactions:

```javascript
// Listen for events
graph.on('eventName', (data) => {
    console.log('Event fired:', data);
});

// Available events:
graph.on('nodeMouseDown', (data) => { /* node, event */ });
graph.on('nodeDoubleClick', (data) => { /* node, event */ });
graph.on('filtered', (data) => { /* nodeId, depth, visibleNodes */ });
graph.on('filterReset', () => { /* filter was reset */ });
graph.on('themeChanged', (data) => { /* theme */ });
graph.on('zoom', (data) => { /* scale, x, y */ });
graph.on('resize', (data) => { /* width, height */ });
graph.on('reset', () => { /* layout was reset */ });
graph.on('nodeAdded', (data) => { /* node */ });
graph.on('nodeRemoved', (data) => { /* nodeId */ });
graph.on('fitted', (data) => { /* scale, x, y */ });
graph.on('destroyed', () => { /* graph was destroyed */ });
```

### Styling

The library uses CSS custom properties (variables) for theming. You can override these to customize appearance:

```css
:root {
    /* Dark theme colors */
    --bg-primary: #1a1a1a;
    --bg-secondary: #2a2a2a;
    --text-primary: #f0f0f0;
    --text-secondary: #a0a0a0;
    --border-color: rgba(255, 255, 255, 0.1);
    --link-color: #5a5a5a;
    --panel-bg: rgba(42, 42, 42, 0.9);
}

[data-theme="light"] {
    /* Light theme colors */
    --bg-primary: #fafafa;
    --bg-secondary: #ffffff;
    --text-primary: #1a1a1a;
    --text-secondary: #666666;
    --border-color: rgba(0, 0, 0, 0.1);
    --link-color: #333333;
    --panel-bg: rgba(255, 255, 255, 0.9);
}
```

### Node Types and Colors

Built-in node types with default colors:
- `major_power`: Red (#E53E3E)
- `regional_power`: Blue (#4299E1) 
- `small_nation`: Green (#38A169)
- `territory`: Orange (#ED8936)

## Examples

### Basic Network
```javascript
const simpleGraph = new GraphNetwork('container', {
    data: {
        nodes: [
            { id: "1", name: "Alice", type: "person", shape: "circle", size: 20 },
            { id: "2", name: "Bob", type: "person", shape: "circle", size: 20 },
            { id: "3", name: "Charlie", type: "person", shape: "circle", size: 20 }
        ],
        links: [
            { source: "1", target: "2", label: "friends", weight: 2, line_type: "solid" },
            { source: "2", target: "3", label: "colleagues", weight: 1, line_type: "dashed" }
        ]
    },
    config: {
        theme: 'light',
        showControls: false
    }
});
```

### Custom Physics
```javascript
const graph = new GraphNetwork('container', {
    data: graphData,
    config: {
        damping: 0.8,              // More bouncy
        repulsionStrength: 10000,  // Stronger repulsion
        attractionStrength: 0.005, // Stronger link attraction
        groupingStrength: 0.002    // Group similar nodes
    }
});
```

### Event Handling
```javascript
const graph = new GraphNetwork('container', { data: graphData });

graph.on('nodeDoubleClick', (data) => {
    alert(`You double-clicked: ${data.node.data.name}`);
});

graph.on('filtered', (data) => {
    console.log(`Showing ${data.visibleNodes.length} nodes`);
    
    // Custom logic when filter changes
    updateInfoPanel(data.visibleNodes);
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Watch for changes
npm run watch
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © [Your Name](https://github.com/yourusername)

## Acknowledgments

Inspired by D3.js force-directed layouts and built for modern web applications requiring interactive network visualizations without heavy dependencies.