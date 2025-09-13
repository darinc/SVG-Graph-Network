# SVG Graph Network

A modern, interactive SVG graph visualization library with advanced theming, physics simulation, and mobile-first design. Create beautiful, customizable network diagrams with dynamic styling and responsive controls.

## ✨ Key Features

### 🎨 Advanced Theming System
- **Dynamic node/edge styling** - No hardcoded types, fully configurable
- **Runtime theme switching** between dark and light modes  
- **Configurable grid backgrounds** with theme-specific colors and patterns
- **Visual state management** (normal, hover, selected, active, disabled)
- **Theme-synchronized UI** - All elements update with theme changes

### ⚡ High-Performance Physics
- **Customizable force-directed layout** with fine-tuned physics parameters
- **Multi-force simulation**: node repulsion, link attraction, type-based grouping
- **Real-time physics controls** with immediate visual feedback
- **Stable simulation** with configurable damping and convergence

### 📱 Mobile-First Design  
- **Touch-optimized interactions** - pinch-to-zoom, drag, double-tap filtering
- **Responsive UI controls** that adapt to screen size
- **Mobile gesture support** with smooth animations
- **Progressive enhancement** from mobile to desktop

### 🎯 Rich Interactions
- **Multi-level filtering** by node connections with configurable depth
- **Smooth pan/zoom/drag** with momentum and constraints  
- **Event system** for custom integrations and analytics
- **Keyboard accessibility** and screen reader support

### 🔧 Developer Experience
- **TypeScript-first** with comprehensive type definitions
- **Modular architecture** with clean separation of concerns
- **Zero dependencies** - pure JavaScript and SVG
- **Extensive configuration** options for every aspect
- **Built-in error handling** with detailed error messages

### 🎪 Visual Flexibility
- **Multiple node shapes** (circle, rectangle, square, triangle)
- **Flexible link styling** (solid, dashed, dotted with custom colors)
- **Dynamic legends** that update with data and themes
- **Customizable grid patterns** integrated into the core library
- **SVG-based rendering** for crisp visuals at any scale

## 🚀 Quick Start

### Installation

```bash
npm install svg-graph-network
```

### Basic Usage

```javascript
import GraphNetwork from 'svg-graph-network';

const graph = new GraphNetwork('container-id', {
    data: {
        nodes: [
            { id: "1", name: "Alice", type: "person", shape: "circle", size: 25 },
            { id: "2", name: "Bob", type: "person", shape: "rectangle", size: 30 },
            { id: "3", name: "Carol", type: "organization", shape: "square", size: 20 }
        ],
        links: [
            { source: "1", target: "2", label: "friends", weight: 2, line_type: "solid" },
            { source: "2", target: "3", label: "works at", weight: 3, line_type: "dashed" }
        ]
    },
    config: {
        theme: 'dark',
        showControls: true,
        showLegend: true,
        showGrid: true
    }
});
```

## 📖 API Reference

### Constructor Options

```typescript
interface GraphNetworkOptions {
    data: {
        nodes: NodeData[];
        links: LinkData[];
    };
    config?: {
        // Physics Configuration
        damping?: number;              // Velocity damping (0.35-1.0, default: 0.95)
        repulsionStrength?: number;    // Node repulsion force (default: 6500)
        attractionStrength?: number;   // Link attraction force (default: 0.001)
        groupingStrength?: number;     // Type-based grouping force (default: 0.001)
        
        // Interaction Configuration  
        zoomSensitivity?: number;      // Mouse wheel sensitivity (default: 1.01)
        filterDepth?: number;          // Connection depth for filtering (default: 1)
        
        // UI Configuration
        showControls?: boolean;        // Show zoom/control buttons (default: true)
        showLegend?: boolean;          // Show node type legend (default: true)
        showTitle?: boolean;           // Show graph title (default: true)
        showBreadcrumbs?: boolean;     // Show navigation breadcrumbs (default: true)
        
        // Theming Configuration
        theme?: 'dark' | 'light';     // Visual theme (default: 'dark')
        title?: string;                // Graph title text
        showGrid?: boolean;            // Show background grid (default: true)
    };
}
```

### Data Types

```typescript
interface NodeData {
    id: string;                       // Unique identifier
    name: string;                     // Display name
    type?: string;                    // Type for styling/grouping (fully configurable)
    shape?: 'circle' | 'rectangle' | 'square' | 'triangle';
    size?: number;                    // Size in pixels
    [key: string]: any;              // Custom properties
}

interface LinkData {
    source: string;                   // Source node ID
    target: string;                   // Target node ID
    label?: string;                   // Display label
    weight?: number;                  // Visual weight/thickness
    line_type?: 'solid' | 'dashed' | 'dotted';
    color?: string;                   // Custom color
    [key: string]: any;              // Custom properties
}
```

### Core Methods

```javascript
// Data Management
graph.setData(graphData);             // Replace all data
graph.addNode(nodeData);              // Add single node
graph.removeNode(nodeId);             // Remove node and connected links
graph.addEdge(linkData);              // Add single link
graph.removeEdge(linkId);             // Remove specific link

// View Control
graph.resetViewAndLayout();           // Reset zoom and restart physics
graph.fitToView();                    // Fit graph to container bounds
graph.zoomIn();                       // Programmatic zoom in
graph.zoomOut();                      // Programmatic zoom out

// Filtering
graph.filterByNode(nodeId, depth);   // Show only connected nodes
graph.resetFilter();                  // Show all nodes

// Theming
graph.setTheme('light' | 'dark');    // Change theme
graph.toggleTheme();                  // Switch between themes
graph.configureGrid(gridConfig);     // Customize background grid

// Cleanup
graph.destroy();                      // Clean up resources
```

### Advanced Theming

```javascript
// Configure custom themes
graph.setTheme({
    name: 'custom',
    colors: {
        background: '#1a1a2e',
        foreground: '#e94560',
        primary: '#0f3460',
        secondary: '#16213e'
    },
    nodeStyles: {
        // Dynamic node type styling - no hardcoded types!
        'user': { fill: '#4CAF50', stroke: '#2E7D32' },
        'admin': { fill: '#FF9800', stroke: '#F57C00' },
        'system': { fill: '#2196F3', stroke: '#1976D2' }
    },
    canvas: {
        showGrid: true,
        gridColor: 'rgba(233, 69, 96, 0.1)',
        gridSize: 40
    }
});
```

### Event System

```javascript
// Listen for events
graph.on('nodeDoubleClick', (data) => {
    console.log('Node double-clicked:', data.node);
});

graph.on('themeChanged', (data) => {
    console.log('Theme changed to:', data.theme);
});

graph.on('filtered', (data) => {
    console.log(`Showing ${data.visibleNodes.length} nodes`);
});

// Available events
'nodeMouseDown' | 'nodeDoubleClick' | 'filtered' | 'filterReset' |
'themeChanged' | 'zoom' | 'resize' | 'reset' | 'nodeAdded' |
'nodeRemoved' | 'fitted' | 'destroyed'
```

## 📱 Mobile Support

Full touch gesture support with mobile-optimized UI:

### Touch Gestures
- **Drag background**: Pan the graph
- **Drag nodes**: Move individual nodes  
- **Double-tap node**: Filter to show connections
- **Double-tap background**: Reset filter
- **Pinch/spread**: Zoom in/out
- **Tap controls**: Use floating action buttons

### Mobile HTML Setup
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=2.0, user-scalable=yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
```

## 🎨 Styling & Customization

The library uses CSS custom properties for comprehensive theming:

```css
:root {
    /* Colors */
    --graph-bg-primary: #1a1a1a;
    --graph-text-primary: #f0f0f0;
    --graph-border-color: rgba(255, 255, 255, 0.1);
    
    /* Grid */
    --graph-grid-color: rgba(255, 165, 0, 0.1);
    --graph-grid-size: 30px;
    
    /* Controls */
    --graph-control-bg: rgba(42, 42, 42, 0.9);
    --graph-control-border: 1px solid #444;
}

[data-theme="light"] {
    --graph-bg-primary: #fafafa;
    --graph-text-primary: #1a1a1a;
    --graph-grid-color: rgba(0, 100, 200, 0.1);
}
```

## 🏗️ Architecture

### Core Components
- **GraphNetwork**: Main orchestrator class
- **ThemeManager**: Dynamic theming and styling system  
- **PhysicsEngine**: Force-directed layout simulation
- **SVGRenderer**: High-performance SVG rendering
- **EventManager**: Touch and mouse interaction handling
- **UIManager**: Responsive controls and interface
- **CameraController**: Pan/zoom/view management

### Design Principles
- **Modular**: Clean separation of concerns
- **Configurable**: Everything is customizable
- **Performance**: Optimized for smooth 60fps
- **Accessibility**: Screen reader and keyboard support
- **Mobile-first**: Touch interactions as primary interface

## 🌐 Browser Support

- **Desktop**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile**: iOS Safari 12+, Chrome Mobile 60+, Samsung Internet 8+

## 📈 Performance

- **Efficient rendering**: SVG-based with minimal DOM manipulation
- **Smart physics**: Adaptive simulation that stops when stable
- **Memory management**: Proper cleanup and event listener removal
- **Bundle size**: ~30KB gzipped with zero dependencies

## 🔗 Examples

- **[Basic Example](./examples/basic.html)**: Simple network with default styling
- **[Advanced Example](./examples/advanced.html)**: Complex network with custom themes
- **[Mobile Demo](./examples/mobile.html)**: Touch-optimized interface

## 📝 Development

```bash
npm install          # Install dependencies
npm run dev         # Start development server (localhost:8080)
npm run build       # Build for production
npm run test        # Run test suite
npm run lint        # Check code quality
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`) 
5. Open a Pull Request

## 📄 License

MIT © [Contributors](https://github.com/yourusername/svg-graph-network/contributors)

---

**Built for modern web applications requiring interactive network visualizations with professional theming and mobile support.**