# SVG Graph Network - API Documentation

Comprehensive API reference for the SVG Graph Network library.

## Table of Contents

- [Constructor](#constructor)
- [Data Management](#data-management)
- [View Control](#view-control)
- [Theming & Styling](#theming--styling)
- [Event System](#event-system)
- [Configuration](#configuration)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)

## Constructor

### `new GraphNetwork(containerId, options)`

Creates a new graph network instance.

**Parameters:**
- `containerId` (string): ID of the HTML container element
- `options` (GraphNetworkOptions): Configuration object

**Returns:** GraphNetwork instance

**Example:**
```javascript
const graph = new GraphNetwork('my-container', {
    data: {
        nodes: [...],
        links: [...]
    },
    config: {
        theme: 'dark',
        showControls: true
    }
});
```

## Data Management

### `setData(graphData)`

Replaces all graph data and redraws the visualization.

**Parameters:**
- `graphData` (GraphData): Object containing nodes and links arrays

**Returns:** void

**Example:**
```javascript
graph.setData({
    nodes: [
        { id: "1", name: "Node 1", type: "type1", shape: "circle", size: 25 }
    ],
    links: [
        { source: "1", target: "2", label: "connection", weight: 2 }
    ]
});
```

### `addNode(nodeData, options?)`

Adds a single node to the graph.

**Parameters:**
- `nodeData` (NodeData): Node object to add
- `options` (NodeCreationOptions, optional): Addition options

**Returns:** Node instance

**Example:**
```javascript
const node = graph.addNode({
    id: "new-node",
    name: "New Node",
    type: "special",
    shape: "rectangle",
    size: 30
});
```

### `removeNode(nodeId, options?)`

Removes a node and all connected links.

**Parameters:**
- `nodeId` (string): ID of the node to remove
- `options` (DeletionOptions, optional): Removal options

**Returns:** boolean - true if removed, false if not found

**Example:**
```javascript
const removed = graph.removeNode("node-1");
```

### `updateNode(nodeId, updates, options?)`

Updates properties of an existing node.

**Parameters:**
- `nodeId` (string): ID of the node to update
- `updates` (Partial<NodeData>): Properties to update
- `options` (object, optional): Update options

**Returns:** Node instance or null

**Example:**
```javascript
graph.updateNode("node-1", {
    name: "Updated Name",
    size: 35,
    type: "updated-type"
});
```

### `addEdge(linkData, options?)`

Adds a single link/edge to the graph.

**Parameters:**
- `linkData` (LinkData): Link object to add
- `options` (EdgeCreationOptions, optional): Addition options

**Returns:** Edge instance

**Example:**
```javascript
const edge = graph.addEdge({
    source: "node-1",
    target: "node-2",
    label: "new connection",
    weight: 3,
    line_type: "dashed"
});
```

### `removeEdge(edgeId, options?)`

Removes a specific edge from the graph.

**Parameters:**
- `edgeId` (string): ID of the edge to remove
- `options` (DeletionOptions, optional): Removal options

**Returns:** boolean - true if removed, false if not found

### `getNode(nodeId)`

Retrieves a node by its ID.

**Parameters:**
- `nodeId` (string): ID of the node to retrieve

**Returns:** Node instance or null

**Example:**
```javascript
const node = graph.getNode("node-1");
if (node) {
    console.log(node.data.name);
}
```

### `getNodes()`

Gets all nodes in the graph.

**Returns:** Array<Node>

### `getLinks()`

Gets all links in the graph.

**Returns:** Array<Link>

### `getEdges()`

Gets all edges in the graph (alias for getLinks).

**Returns:** Array<Edge>

## View Control

### `resetViewAndLayout()`

Resets the view transform and restarts the physics simulation.

**Returns:** void

**Example:**
```javascript
graph.resetViewAndLayout();
```

### `fitToView(padding?)`

Fits the entire graph to the container bounds.

**Parameters:**
- `padding` (number, optional): Padding around the graph in pixels (default: 50)

**Returns:** void

**Example:**
```javascript
graph.fitToView(100); // 100px padding
```

### `zoomIn(factor?)`

Programmatically zoom in on the graph.

**Parameters:**
- `factor` (number, optional): Zoom factor (default: 1.1)

**Returns:** void

**Example:**
```javascript
graph.zoomIn(1.2); // Zoom in by 20%
```

### `zoomOut(factor?)`

Programmatically zoom out on the graph.

**Parameters:**
- `factor` (number, optional): Zoom factor (default: 0.9)

**Returns:** void

### `setZoom(scale, centerX?, centerY?)`

Sets the zoom level directly.

**Parameters:**
- `scale` (number): Zoom scale (1.0 = 100%)
- `centerX` (number, optional): X coordinate to zoom around
- `centerY` (number, optional): Y coordinate to zoom around

**Returns:** void

### `getTransform()`

Gets the current view transform state.

**Returns:** TransformState object with x, y, and scale properties

**Example:**
```javascript
const transform = graph.getTransform();
console.log(`Zoom: ${transform.scale}, Pan: ${transform.x}, ${transform.y}`);
```

### `setTransform(transform)`

Sets the view transform directly.

**Parameters:**
- `transform` (TransformState): Transform object with x, y, scale properties

**Returns:** void

## Filtering

### `filterByNode(nodeId, depth?)`

Filters the graph to show only a specific node and its connections.

**Parameters:**
- `nodeId` (string): ID of the central node
- `depth` (number, optional): Connection depth to show (default: 1)

**Returns:** Array<string> - IDs of visible nodes

**Example:**
```javascript
const visibleNodes = graph.filterByNode("central-node", 2);
console.log(`Showing ${visibleNodes.length} nodes`);
```

### `resetFilter()`

Resets the filter to show all nodes.

**Returns:** void

### `isFiltered()`

Checks if the graph is currently filtered.

**Returns:** boolean

### `getFilterState()`

Gets the current filter state.

**Returns:** FilterState object or null

## Theming & Styling

### `setTheme(theme)`

Sets the visual theme of the graph.

**Parameters:**
- `theme` (string | ThemeConfig): Theme name ('dark', 'light') or custom theme object

**Returns:** void

**Example:**
```javascript
// Built-in theme
graph.setTheme('light');

// Custom theme
graph.setTheme({
    name: 'custom',
    colors: {
        background: '#1a1a2e',
        foreground: '#e94560',
        primary: '#0f3460'
    },
    nodeStyles: {
        'user': { fill: '#4CAF50', stroke: '#2E7D32' },
        'admin': { fill: '#FF9800', stroke: '#F57C00' }
    }
});
```

### `toggleTheme()`

Toggles between dark and light themes.

**Returns:** string - The new theme name

### `getTheme()`

Gets the current theme configuration.

**Returns:** ThemeConfig object

### `configureGrid(gridConfig)`

Configures the background grid pattern.

**Parameters:**
- `gridConfig` (CanvasConfig): Grid configuration object

**Returns:** void

**Example:**
```javascript
graph.configureGrid({
    showGrid: true,
    gridColor: 'rgba(255, 165, 0, 0.2)',
    gridSize: 40,
    gridStyle: 'lines',
    syncBackgroundTransform: true  // Grid moves with zoom/pan (default: true)
});
```

### `getGridConfig()`

Gets the current grid configuration.

**Returns:** CanvasConfig object

### Background Transform Synchronization

**Feature**: The `syncBackgroundTransform` option enables the background grid to move and scale in sync with graph zoom and pan operations, creating a cohesive visual experience.

**Default Behavior**: This feature is enabled by default (`syncBackgroundTransform: true`) in all built-in themes.

**How it works**:
- When you zoom the graph, the background grid scales proportionally
- When you pan the graph, the background grid moves accordingly
- This creates the visual effect of the graph and background being part of the same coordinate system

**Configuration**:
```javascript
// Enable background sync (default)
graph.setTheme({
    name: 'custom',
    canvas: {
        showGrid: true,
        syncBackgroundTransform: true
    }
});

// Disable background sync for static grid
graph.setTheme({
    name: 'static-grid',
    canvas: {
        showGrid: true,
        syncBackgroundTransform: false
    }
});
```

### `applyNodeStyle(nodeId, styles)`

Applies custom styles to a specific node.

**Parameters:**
- `nodeId` (string): ID of the node to style
- `styles` (NodeStyleConfig): Style properties to apply

**Returns:** void

**Example:**
```javascript
graph.applyNodeStyle("special-node", {
    fill: "#FF5722",
    stroke: "#D84315",
    strokeWidth: 3,
    opacity: 0.8
});
```

### `applyEdgeStyle(edgeId, styles)`

Applies custom styles to a specific edge.

**Parameters:**
- `edgeId` (string): ID of the edge to style
- `styles` (EdgeStyleConfig): Style properties to apply

**Returns:** void

## Event System

### `on(eventName, callback)`

Registers an event listener.

**Parameters:**
- `eventName` (string): Name of the event to listen for
- `callback` (function): Function to call when event occurs

**Returns:** void

**Example:**
```javascript
graph.on('nodeDoubleClick', (data) => {
    console.log('Node double-clicked:', data.node.data.name);
});

graph.on('themeChanged', (data) => {
    console.log('Theme changed to:', data.theme);
});
```

### `off(eventName, callback?)`

Removes an event listener.

**Parameters:**
- `eventName` (string): Name of the event
- `callback` (function, optional): Specific callback to remove (removes all if omitted)

**Returns:** void

### `emit(eventName, data?)`

Emits a custom event.

**Parameters:**
- `eventName` (string): Name of the event to emit
- `data` (any, optional): Data to pass with the event

**Returns:** void

### Available Events

| Event Name | Description | Data Passed |
|------------|-------------|-------------|
| `nodeMouseDown` | Mouse pressed on node | `{ node, event }` |
| `nodeDoubleClick` | Node double-clicked | `{ node, event }` |
| `nodeHover` | Mouse enters/leaves node | `{ node, event, entering }` |
| `filtered` | Filter applied | `{ nodeId, depth, visibleNodes }` |
| `filterReset` | Filter cleared | `{}` |
| `themeChanged` | Theme switched | `{ theme, previous }` |
| `zoom` | Zoom level changed | `{ scale, x, y }` |
| `pan` | View panned | `{ x, y, deltaX, deltaY }` |
| `resize` | Container resized | `{ width, height }` |
| `reset` | Layout reset | `{}` |
| `nodeAdded` | Node added to graph | `{ node }` |
| `nodeRemoved` | Node removed | `{ nodeId }` |
| `edgeAdded` | Edge added to graph | `{ edge }` |
| `edgeRemoved` | Edge removed | `{ edgeId }` |
| `fitted` | Graph fitted to view | `{ scale, x, y }` |
| `destroyed` | Graph instance destroyed | `{}` |

## Configuration

### Physics Configuration

```typescript
interface PhysicsConfig {
    damping: number;              // Velocity damping (0.35-1.0, default: 0.95)
    repulsionStrength: number;    // Node repulsion force (default: 6500)
    attractionStrength: number;   // Link attraction force (default: 0.001)
    groupingStrength: number;     // Type-based grouping (default: 0.001)
}
```

### UI Configuration

```typescript
interface UIConfig {
    showControls: boolean;        // Show control buttons (default: true)
    showLegend: boolean;          // Show legend panel (default: true)
    showTitle: boolean;           // Show title (default: true)
    showBreadcrumbs: boolean;     // Show breadcrumbs (default: true)
    theme: 'light' | 'dark';     // Visual theme (default: 'dark')
    title: string;                // Graph title (default: 'Graph Network')
}
```

### Interaction Configuration

```typescript
interface InteractionConfig {
    zoomSensitivity: number;      // Zoom sensitivity (default: 1.01)
    filterDepth: number;          // Default filter depth (default: 1)
}
```

## Type Definitions

### Core Data Types

```typescript
interface NodeData {
    id: string;                   // Unique identifier
    name: string;                 // Display name
    type?: string;                // Type for styling/grouping
    shape?: 'circle' | 'rectangle' | 'square' | 'triangle';
    size?: number;                // Size in pixels
    [key: string]: any;          // Custom properties
}

interface LinkData {
    source: string;               // Source node ID
    target: string;               // Target node ID
    label?: string;               // Display label
    weight?: number;              // Visual weight
    line_type?: 'solid' | 'dashed' | 'dotted';
    color?: string;               // Custom color
    [key: string]: any;          // Custom properties
}

interface GraphData {
    nodes: NodeData[];
    links: LinkData[];
}
```

### Style Configuration Types

```typescript
interface NodeStyleConfig {
    fill?: string;                // Fill color
    stroke?: string;              // Border color
    strokeWidth?: number;         // Border width
    opacity?: number;             // Transparency (0-1)
    strokeDasharray?: string;     // Border dash pattern
    filter?: string;              // SVG filter effects
    [attribute: string]: any;     // Custom SVG attributes
}

interface EdgeStyleConfig {
    stroke?: string;              // Line color
    strokeWidth?: number;         // Line width
    opacity?: number;             // Transparency (0-1)
    strokeDasharray?: string;     // Line dash pattern
    markerEnd?: string;           // Arrow marker
    filter?: string;              // SVG filter effects
    [attribute: string]: any;     // Custom SVG attributes
}
```

### Theme Configuration

```typescript
interface ThemeConfig {
    name: string;                 // Theme identifier
    version?: string;             // Theme version
    
    colors?: {
        primary?: string;         // Primary color
        secondary?: string;       // Secondary color
        background?: string;      // Background color
        foreground?: string;      // Text/foreground color
        hover?: string;           // Hover state color
        selected?: string;        // Selection color
        disabled?: string;        // Disabled state color
        [key: string]: string | undefined;
    };
    
    nodeStyles?: {
        default?: NodeStyleConfig;
        [nodeType: string]: NodeStyleConfig | undefined;
    };
    
    edgeStyles?: {
        default?: EdgeStyleConfig;
        [edgeType: string]: EdgeStyleConfig | undefined;
    };
    
    canvas?: {
        background?: string;      // Canvas background
        showGrid?: boolean;       // Show grid pattern
        gridColor?: string;       // Grid line color
        gridSize?: number;        // Grid cell size
        gridOpacity?: number;     // Grid transparency
        gridStyle?: 'lines' | 'dots' | 'crosses';
        syncBackgroundTransform?: boolean; // Synchronize background with zoom/pan (default: true)
    };
}
```

## Error Handling

The library provides comprehensive error handling with specific error types:

### Error Types

- `NodeValidationError`: Invalid node data
- `NodeExistsError`: Node already exists
- `NodeNotFoundError`: Node not found
- `EdgeValidationError`: Invalid edge data
- `EdgeExistsError`: Edge already exists
- `EdgeNotFoundError`: Edge not found
- `InvalidEdgeReferencesError`: Edge references non-existent nodes

### Error Handling Example

```javascript
try {
    graph.addNode({
        id: "duplicate-id",
        name: "Test Node"
    });
} catch (error) {
    if (error instanceof NodeExistsError) {
        console.log('Node already exists:', error.nodeId);
    }
}
```

### Utility Methods

```javascript
// Clean up resources
graph.destroy();

// Check if graph is destroyed
const isDestroyed = graph.isDestroyed();

// Get graph statistics
const stats = graph.getStats();
console.log(`Nodes: ${stats.nodeCount}, Edges: ${stats.edgeCount}`);

// Get container bounds
const bounds = graph.getBounds();
```

## Advanced Usage

### Custom Node Types

```javascript
// Define custom styling for any node type
graph.setTheme({
    name: 'custom',
    nodeStyles: {
        'server': {
            fill: '#2196F3',
            stroke: '#1976D2',
            strokeWidth: 2,
            opacity: 0.9
        },
        'database': {
            fill: '#4CAF50',
            stroke: '#2E7D32',
            strokeWidth: 3
        },
        'user': {
            fill: '#FF9800',
            stroke: '#F57C00',
            strokeDasharray: '5,5'
        }
    }
});
```

### Performance Optimization

```javascript
// Batch operations for better performance
graph.startBatch();
for (let i = 0; i < 1000; i++) {
    graph.addNode({ id: `node-${i}`, name: `Node ${i}`, type: 'bulk' });
}
graph.endBatch(); // Triggers single redraw

// Control physics simulation
graph.pauseSimulation();
graph.resumeSimulation();
graph.setSimulationAlpha(0.3); // Control simulation intensity
```

### Integration Examples

```javascript
// React integration
useEffect(() => {
    const graph = new GraphNetwork('graph-container', options);
    
    graph.on('nodeDoubleClick', (data) => {
        setSelectedNode(data.node.data);
    });
    
    return () => graph.destroy();
}, []);

// Vue integration
mounted() {
    this.graph = new GraphNetwork(this.$refs.container.id, this.options);
    this.graph.on('themeChanged', this.handleThemeChange);
},
beforeDestroy() {
    this.graph?.destroy();
}
```

This comprehensive API provides full control over every aspect of the graph visualization, from basic data manipulation to advanced theming and performance optimization.