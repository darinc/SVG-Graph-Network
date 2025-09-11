# Getting Started

This guide will help you get up and running with SVG Graph Network in just a few minutes.

## Installation

### Option 1: CDN (Quickest)
Add these lines to your HTML:

```html
<link rel="stylesheet" href="https://unpkg.com/svg-graph-network/dist/svg-graph-network.css">
<script src="https://unpkg.com/svg-graph-network/dist/svg-graph-network.min.js"></script>
```

### Option 2: NPM
```bash
npm install svg-graph-network
```

## Basic Usage

### 1. Create a container
```html
<div id="my-graph" style="width: 800px; height: 600px;"></div>
```

### 2. Prepare your data
```javascript
const data = {
    nodes: [
        { id: "A", name: "Alice", type: "person", shape: "circle", size: 20 },
        { id: "B", name: "Bob", type: "person", shape: "circle", size: 20 },
        { id: "C", name: "Charlie", type: "person", shape: "circle", size: 20 }
    ],
    links: [
        { source: "A", target: "B", label: "friends", weight: 2, line_type: "solid" },
        { source: "B", target: "C", label: "colleagues", weight: 1, line_type: "dashed" }
    ]
};
```

### 3. Initialize the graph
```javascript
const graph = new GraphNetwork('my-graph', {
    data: data,
    config: {
        theme: 'light',
        showControls: true
    }
});
```

## Common Patterns

### Adding interaction
```javascript
graph.on('nodeDoubleClick', (data) => {
    console.log('Double-clicked:', data.node.data.name);
});
```

### Changing themes
```javascript
// Set theme directly
graph.setTheme('dark');

// Toggle theme
graph.toggleTheme();
```

### Filtering the graph
```javascript
// Show only node "A" and its immediate neighbors
graph.filterByNode('A', 1);

// Reset to show all nodes
graph.resetFilter();
```

### Customizing physics
```javascript
const graph = new GraphNetwork('container', {
    data: myData,
    config: {
        damping: 0.8,           // Less damping = more bouncy
        repulsionStrength: 8000, // Higher = nodes spread out more
        attractionStrength: 0.002 // Higher = connected nodes stick closer
    }
});
```

## Next Steps

- Check out the [full examples](examples/) folder
- Read the [complete API documentation](README.md#api-reference)
- Customize styling with [CSS variables](README.md#styling)

## Need Help?

- 🐛 [Report bugs](https://github.com/yourusername/svg-graph-network/issues)
- 💬 [Ask questions](https://github.com/yourusername/svg-graph-network/discussions)
- 📖 [Read full docs](README.md)