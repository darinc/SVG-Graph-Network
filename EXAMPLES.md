# SVG Graph Network - Examples Guide

This guide explains the example implementations and demonstrates various features of the library.

## Available Examples

### 1. Basic Example (`examples/basic.html`)

A simple demonstration of core functionality with default styling.

**Features Demonstrated:**
- Basic graph creation with nodes and links
- Default dark theme
- Interactive controls (zoom, pan, reset)
- Node filtering by double-click
- Mobile touch support

**Key Code:**
```javascript
const graph = new GraphNetwork('graph-container', {
    data: basicNetworkData,
    config: {
        theme: 'dark',
        showControls: true,
        showLegend: true,
        showTitle: true,
        title: 'Basic Network Example'
    }
});
```

**Sample Data Structure:**
```javascript
const basicNetworkData = {
    nodes: [
        {
            id: "alice",
            name: "Alice",
            type: "person",
            shape: "circle",
            size: 25
        },
        {
            id: "bob", 
            name: "Bob",
            type: "person",
            shape: "rectangle",
            size: 30
        }
    ],
    links: [
        {
            source: "alice",
            target: "bob",
            label: "friends",
            weight: 2,
            line_type: "solid"
        }
    ]
};
```

### 2. Advanced Example (`examples/advanced.html`)

A complex demonstration showcasing advanced theming and configuration options.

**Features Demonstrated:**
- Dynamic theme switching with toggle control
- Two different graph datasets (1914 vs 2024 diplomatic networks)
- Custom node types with different styling
- Configurable grid background
- Advanced physics parameters
- Custom color schemes
- Mobile-optimized responsive design

**Key Features:**

#### Theme Switching
```javascript
// Theme toggle implementation
function toggleEra() {
    currentEra = currentEra === '1914' ? '2024' : '1914';
    
    // Update data
    graph.setData(currentEra === '1914' ? historicalData : modernData);
    
    // Switch theme with custom styling
    const theme = currentEra === '1914' ? 'sepia' : 'modern';
    graph.setTheme(theme);
    
    // Update UI
    updateToggleUI();
}
```

#### Custom Theme Configuration
```javascript
const customThemes = {
    sepia: {
        name: 'sepia',
        colors: {
            background: '#2a1810',
            foreground: '#d4af37',
            primary: '#8b4513'
        },
        canvas: {
            showGrid: true,
            gridColor: 'rgba(212, 175, 55, 0.1)',
            gridSize: 30
        },
        nodeStyles: {
            'major_power': { fill: '#8B0000', stroke: '#660000' },
            'regional_power': { fill: '#4682B4', stroke: '#2F4F4F' },
            'small_nation': { fill: '#228B22', stroke: '#006400' }
        }
    },
    modern: {
        name: 'modern',
        colors: {
            background: '#0f0f0f',
            foreground: '#00ff88',
            primary: '#0066cc'
        },
        nodeStyles: {
            'major_power': { fill: '#ff3366', stroke: '#cc1144' },
            'alliance': { fill: '#33ccff', stroke: '#0099cc' },
            'economic_zone': { fill: '#ffaa00', stroke: '#cc7700' }
        }
    }
};
```

#### Mobile Responsive Design
```javascript
// Detect mobile and adjust configuration
const isMobile = window.innerWidth <= 768;

const mobileConfig = {
    damping: 0.9,              // More stable on mobile
    repulsionStrength: 4000,   // Tighter layout
    zoomSensitivity: 1.05,     // More responsive touch zoom
    showTitle: !isMobile       // Hide title on small screens
};
```

### 3. Data Structures Used

#### Historical Network (1914)
Represents European diplomatic relationships before WWI:
```javascript
{
    nodes: [
        {
            id: "germany",
            name: "German Empire", 
            type: "major_power",
            shape: "rectangle",
            size: 35
        },
        {
            id: "britain",
            name: "British Empire",
            type: "major_power", 
            shape: "rectangle",
            size: 35
        }
    ],
    links: [
        {
            source: "germany",
            target: "austria_hungary",
            label: "Dual Alliance",
            weight: 4,
            line_type: "solid"
        }
    ]
}
```

#### Modern Network (2024)
Represents contemporary international organizations:
```javascript
{
    nodes: [
        {
            id: "nato",
            name: "NATO",
            type: "alliance",
            shape: "square", 
            size: 40
        },
        {
            id: "eu",
            name: "European Union",
            type: "economic_zone",
            shape: "circle",
            size: 38
        }
    ],
    links: [
        {
            source: "nato",
            target: "eu", 
            label: "Institutional Cooperation",
            weight: 3,
            line_type: "dashed"
        }
    ]
}
```

## Interactive Features Guide

### Touch Gestures (Mobile)

| Gesture | Action | Example Use Case |
|---------|--------|------------------|
| **Single finger drag on background** | Pan the view | Navigate around large networks |
| **Single finger drag on node** | Move node position | Adjust layout manually |
| **Double-tap node** | Filter to show connections | Focus on specific relationships |
| **Double-tap background** | Reset filter | Return to full network view |
| **Pinch/spread** | Zoom in/out | Get overview or examine details |
| **Tap control buttons** | Various actions | Quick zoom, reset, theme toggle |

### Desktop Interactions

| Input | Action | Notes |
|-------|--------|-------|
| **Mouse wheel** | Zoom in/out | Smooth continuous zoom |
| **Click + drag background** | Pan view | Momentum-based scrolling |
| **Click + drag node** | Move node | Physics simulation responds |
| **Double-click node** | Filter network | Shows connections up to configured depth |
| **Double-click background** | Reset filter | Returns to full view |

### Control Buttons

**Zoom Controls:**
- `+` button: Zoom in by 10% 
- `-` button: Zoom out by 10%
- `⊙` button: Fit graph to view and reset layout

**Theme Controls:**
- `🌙`/`🌞` button: Toggle between dark/light themes
- Era toggle (advanced example): Switch between historical datasets

**Settings Panel:**
- `⚙` button: Open physics configuration panel
- Real-time sliders for damping, forces, and other parameters

## Customization Examples

### 1. Custom Node Styling

```javascript
// Define custom node types with specific styling
graph.setTheme({
    name: 'custom-business',
    nodeStyles: {
        'ceo': {
            fill: '#FFD700',
            stroke: '#B8860B',
            strokeWidth: 3,
            opacity: 1.0
        },
        'manager': {
            fill: '#4169E1',
            stroke: '#191970',
            strokeWidth: 2,
            opacity: 0.9
        },
        'employee': {
            fill: '#32CD32',
            stroke: '#228B22',
            strokeWidth: 1,
            opacity: 0.8
        }
    }
});
```

### 2. Custom Physics Configuration

```javascript
// High-energy, dynamic layout
const dynamicPhysics = {
    damping: 0.7,              // More bouncy
    repulsionStrength: 12000,  // Strong separation
    attractionStrength: 0.008, // Strong connections
    groupingStrength: 0.004    // Group by type
};

// Stable, minimal movement layout  
const stablePhysics = {
    damping: 0.98,             // Minimal bounce
    repulsionStrength: 3000,   // Gentle separation
    attractionStrength: 0.002, // Weak connections
    groupingStrength: 0.001    // Minimal grouping
};
```

### 3. Event Handling Examples

```javascript
// Track user interactions
graph.on('nodeDoubleClick', (data) => {
    console.log(`User focused on: ${data.node.data.name}`);
    
    // Custom logic for node focus
    showNodeDetails(data.node.data);
    updateSidebar(data.node.data);
});

// Monitor filter changes
graph.on('filtered', (data) => {
    const stats = `Showing ${data.visibleNodes.length} of ${graph.getNodes().length} nodes`;
    updateStatusBar(stats);
});

// Track theme changes for analytics
graph.on('themeChanged', (data) => {
    analytics.track('theme_changed', {
        from: data.previous,
        to: data.theme,
        timestamp: Date.now()
    });
});
```

### 4. Integration with UI Frameworks

#### React Integration
```jsx
import React, { useEffect, useRef } from 'react';
import GraphNetwork from 'svg-graph-network';

const GraphComponent = ({ data, onNodeSelect }) => {
    const containerRef = useRef();
    const graphRef = useRef();
    
    useEffect(() => {
        graphRef.current = new GraphNetwork(containerRef.current.id, {
            data,
            config: { theme: 'dark', showControls: true }
        });
        
        graphRef.current.on('nodeDoubleClick', (event) => {
            onNodeSelect(event.node.data);
        });
        
        return () => graphRef.current?.destroy();
    }, []);
    
    useEffect(() => {
        if (graphRef.current) {
            graphRef.current.setData(data);
        }
    }, [data]);
    
    return <div id="graph-container" ref={containerRef} style={{ width: '100%', height: '600px' }} />;
};
```

#### Vue Integration
```vue
<template>
    <div id="graph-container" ref="container" class="graph-container"></div>
</template>

<script>
import GraphNetwork from 'svg-graph-network';

export default {
    props: ['graphData'],
    data() {
        return {
            graph: null
        };
    },
    mounted() {
        this.graph = new GraphNetwork(this.$refs.container.id, {
            data: this.graphData,
            config: {
                theme: 'light',
                showControls: true,
                showLegend: true
            }
        });
        
        this.graph.on('nodeDoubleClick', this.handleNodeClick);
    },
    beforeDestroy() {
        this.graph?.destroy();
    },
    watch: {
        graphData: {
            handler(newData) {
                if (this.graph) {
                    this.graph.setData(newData);
                }
            },
            deep: true
        }
    },
    methods: {
        handleNodeClick(data) {
            this.$emit('node-selected', data.node.data);
        }
    }
};
</script>
```

## Performance Considerations

### Large Networks (1000+ nodes)

```javascript
// Optimize for large datasets
const largeNetworkConfig = {
    // Reduce physics intensity
    damping: 0.95,
    repulsionStrength: 8000,
    attractionStrength: 0.0005,
    
    // Disable expensive features
    showLegend: false,        // Generate legend on demand
    showGrid: false,          // Grid can impact performance
    
    // Batch operations
    enableBatching: true
};

// Use batch operations for adding multiple elements
graph.startBatch();
largeDataset.forEach(node => graph.addNode(node));
graph.endBatch(); // Single redraw
```

### Memory Management

```javascript
// Proper cleanup for SPAs
const cleanup = () => {
    graph.off(); // Remove all event listeners
    graph.destroy(); // Clean up DOM and resources
    graph = null; // Release reference
};

// React useEffect cleanup
useEffect(() => {
    return cleanup;
}, []);

// Vue beforeDestroy
beforeDestroy() {
    cleanup();
}
```

## Troubleshooting Common Issues

### 1. Graph Not Rendering
```javascript
// Check container exists and has dimensions
const container = document.getElementById('graph-container');
console.log('Container:', container);
console.log('Dimensions:', container.offsetWidth, container.offsetHeight);

// Ensure container has explicit size
container.style.width = '800px';
container.style.height = '600px';
```

### 2. Touch Interactions Not Working
```html
<!-- Ensure proper viewport meta tags -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=2.0, user-scalable=yes">
<meta name="mobile-web-app-capable" content="yes">
```

### 3. Performance Issues
```javascript
// Monitor performance
graph.on('render', (data) => {
    console.log('Render time:', data.renderTime);
    console.log('Node count:', data.nodeCount);
});

// Reduce complexity if needed
if (nodeCount > 500) {
    config.showGrid = false;
    config.showLegend = false;
}
```

This guide covers the essential patterns and use cases for implementing the SVG Graph Network library in real applications.