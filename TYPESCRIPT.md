# TypeScript Usage Guide

Complete guide for using SVG Graph Network with TypeScript, including all available type definitions and best practices.

## Installation & Setup

```bash
npm install svg-graph-network
```

The library includes comprehensive TypeScript definitions out of the box - no additional `@types` packages needed.

## Basic TypeScript Usage

### 1. Basic Graph Creation

```typescript
import GraphNetwork, { 
    NodeData, 
    LinkData, 
    GraphData, 
    GraphConfig 
} from 'svg-graph-network';

// Define your data with proper typing
const nodes: NodeData[] = [
    {
        id: "user1",
        name: "Alice Smith",
        type: "admin",
        shape: "circle",
        size: 30
    },
    {
        id: "user2", 
        name: "Bob Johnson",
        type: "user",
        shape: "rectangle",
        size: 25
    }
];

const links: LinkData[] = [
    {
        source: "user1",
        target: "user2",
        label: "manages",
        weight: 3,
        line_type: "solid"
    }
];

const graphData: GraphData = { nodes, links };

const config: Partial<GraphConfig> = {
    theme: 'dark',
    showControls: true,
    showLegend: true,
    damping: 0.95,
    repulsionStrength: 6500
};

// Create strongly-typed graph instance
const graph = new GraphNetwork('container-id', {
    data: graphData,
    config
});
```

### 2. Custom Node Types with Type Safety

```typescript
import { NodeData } from 'svg-graph-network';

// Extend NodeData for your specific use case
interface CustomNodeData extends NodeData {
    department: string;
    level: 'junior' | 'senior' | 'manager';
    skills: string[];
    salary?: number;
}

interface CustomLinkData extends LinkData {
    relationship: 'reports_to' | 'collaborates' | 'mentors';
    frequency: 'daily' | 'weekly' | 'monthly';
}

// Use your custom types
const employees: CustomNodeData[] = [
    {
        id: "emp1",
        name: "Alice Developer",
        type: "engineer",
        shape: "circle",
        size: 25,
        department: "Engineering",
        level: "senior",
        skills: ["TypeScript", "React", "Node.js"],
        salary: 95000
    },
    {
        id: "emp2",
        name: "Bob Designer", 
        type: "designer",
        shape: "square",
        size: 30,
        department: "Design",
        level: "manager",
        skills: ["Figma", "User Research", "Prototyping"]
    }
];

const relationships: CustomLinkData[] = [
    {
        source: "emp1",
        target: "emp2",
        label: "collaborates with",
        relationship: "collaborates",
        frequency: "daily",
        weight: 2
    }
];
```

### 3. Event Handling with Type Safety

```typescript
import { 
    EventCallback, 
    NodeEvent, 
    ThemeEvent, 
    FilterEvent 
} from 'svg-graph-network';

// Strongly typed event handlers
const handleNodeClick: EventCallback<NodeEvent> = (event) => {
    console.log('Node clicked:', event.nodeId);
    console.log('Node data:', event.nodeData);
    // TypeScript knows the exact shape of the event
};

const handleThemeChange: EventCallback<ThemeEvent> = (event) => {
    console.log('Theme changed to:', event.theme);
    // event.theme is properly typed as 'light' | 'dark'
};

const handleFilter: EventCallback<FilterEvent> = (event) => {
    if (event.type === 'filtered') {
        console.log(`Filtering from node: ${event.nodeId}`);
        console.log(`Depth: ${event.depth}`);
        console.log(`Visible nodes: ${event.visibleNodes?.length}`);
    }
};

// Register typed event handlers
graph.on('nodeDoubleClick', handleNodeClick);
graph.on('themeChanged', handleThemeChange);
graph.on('filtered', handleFilter);
```

## Advanced TypeScript Patterns

### 1. Custom Theme Configuration

```typescript
import { 
    ThemeConfig, 
    NodeStyleConfig, 
    EdgeStyleConfig,
    CanvasConfig 
} from 'svg-graph-network';

// Define strongly-typed custom theme
const customTheme: ThemeConfig = {
    name: 'corporate',
    version: '1.0.0',
    
    colors: {
        background: '#1a1a2e',
        foreground: '#eee',
        primary: '#16213e',
        secondary: '#0f3460',
        hover: '#e94560',
        selected: '#f39c12'
    },
    
    nodeStyles: {
        'executive': {
            fill: '#gold',
            stroke: '#darkgoldenrod',
            strokeWidth: 3,
            opacity: 1.0
        } as NodeStyleConfig,
        
        'manager': {
            fill: '#steelblue',
            stroke: '#darkblue', 
            strokeWidth: 2,
            opacity: 0.9
        } as NodeStyleConfig,
        
        'employee': {
            fill: '#lightgreen',
            stroke: '#darkgreen',
            strokeWidth: 1,
            opacity: 0.8
        } as NodeStyleConfig
    },
    
    edgeStyles: {
        'reports_to': {
            stroke: '#666',
            strokeWidth: 2,
            markerEnd: 'url(#arrowhead)'
        } as EdgeStyleConfig,
        
        'collaborates': {
            stroke: '#999',
            strokeWidth: 1,
            strokeDasharray: '5,5'
        } as EdgeStyleConfig
    },
    
    canvas: {
        background: '#1a1a2e',
        showGrid: true,
        gridColor: 'rgba(255, 255, 255, 0.1)',
        gridSize: 30,
        gridOpacity: 0.1,
        syncBackgroundTransform: true  // Grid follows zoom/pan transforms
    } as CanvasConfig
};

// Apply with full type safety
graph.setTheme(customTheme);
```

### 2. Generic Graph Wrapper Class

```typescript
import GraphNetwork, { 
    NodeData, 
    LinkData, 
    GraphData,
    GraphConfig,
    EventCallback,
    NodeEvent 
} from 'svg-graph-network';

// Generic wrapper for different data types
class TypedGraphNetwork<TNode extends NodeData, TLink extends LinkData> {
    private graph: GraphNetwork;
    private _data: GraphData;
    
    constructor(
        containerId: string, 
        data: { nodes: TNode[], links: TLink[] },
        config?: Partial<GraphConfig>
    ) {
        this._data = data;
        this.graph = new GraphNetwork(containerId, { data, config });
    }
    
    // Type-safe data access
    getTypedNodes(): TNode[] {
        return this._data.nodes as TNode[];
    }
    
    getTypedLinks(): TLink[] {
        return this._data.links as TLink[];
    }
    
    // Type-safe node operations
    addTypedNode(node: TNode): void {
        this.graph.addNode(node);
        this._data.nodes.push(node);
    }
    
    // Type-safe event handling
    onNodeInteraction(callback: (node: TNode) => void): void {
        this.graph.on('nodeDoubleClick', (event: NodeEvent) => {
            const typedNode = this._data.nodes.find(n => n.id === event.nodeId) as TNode;
            if (typedNode) {
                callback(typedNode);
            }
        });
    }
    
    // Proxy other methods
    setTheme(theme: string | ThemeConfig): void {
        this.graph.setTheme(theme);
    }
    
    destroy(): void {
        this.graph.destroy();
    }
}

// Usage with custom types
interface EmployeeNode extends NodeData {
    department: string;
    role: string;
}

interface ReportingLink extends LinkData {
    reportingType: 'direct' | 'dotted' | 'matrix';
}

const orgChart = new TypedGraphNetwork<EmployeeNode, ReportingLink>(
    'org-chart-container',
    {
        nodes: employees, // TypeScript ensures these match EmployeeNode[]
        links: reporting  // TypeScript ensures these match ReportingLink[]
    },
    { theme: 'light' }
);

// Type-safe callbacks
orgChart.onNodeInteraction((employee: EmployeeNode) => {
    console.log(`Clicked employee: ${employee.name} in ${employee.department}`);
    // employee is properly typed as EmployeeNode
});
```

### 3. Configuration Builder Pattern

```typescript
import { 
    GraphConfig, 
    PhysicsConfig, 
    UIConfig, 
    InteractionConfig 
} from 'svg-graph-network';

class GraphConfigBuilder {
    private config: Partial<GraphConfig> = {};
    
    physics(config: Partial<PhysicsConfig>): this {
        Object.assign(this.config, config);
        return this;
    }
    
    ui(config: Partial<UIConfig>): this {
        Object.assign(this.config, config);
        return this;
    }
    
    interaction(config: Partial<InteractionConfig>): this {
        Object.assign(this.config, config);
        return this;
    }
    
    theme(theme: 'light' | 'dark'): this {
        this.config.theme = theme;
        return this;
    }
    
    build(): Partial<GraphConfig> {
        return { ...this.config };
    }
}

// Fluent interface with type safety
const config = new GraphConfigBuilder()
    .physics({
        damping: 0.95,
        repulsionStrength: 8000,
        attractionStrength: 0.002
    })
    .ui({
        showControls: true,
        showLegend: true,
        showTitle: false
    })
    .interaction({
        zoomSensitivity: 1.02,
        filterDepth: 2
    })
    .theme('dark')
    .build();

const graph = new GraphNetwork('container', { data: graphData, config });
```

### 4. React Integration with TypeScript

```tsx
import React, { useEffect, useRef, useState } from 'react';
import GraphNetwork, { 
    NodeData, 
    LinkData, 
    GraphData, 
    ThemeConfig,
    NodeEvent 
} from 'svg-graph-network';

interface GraphComponentProps {
    data: GraphData;
    theme?: 'light' | 'dark' | ThemeConfig;
    onNodeSelect?: (node: NodeData) => void;
    onFilterChange?: (visibleNodes: string[]) => void;
    className?: string;
}

const GraphComponent: React.FC<GraphComponentProps> = ({
    data,
    theme = 'dark',
    onNodeSelect,
    onFilterChange,
    className
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<GraphNetwork | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!containerRef.current) return;
        
        try {
            // Create graph with proper typing
            graphRef.current = new GraphNetwork(containerRef.current.id, {
                data,
                config: {
                    theme: typeof theme === 'string' ? theme : 'dark',
                    showControls: true,
                    showLegend: true
                }
            });
            
            // Type-safe event handlers
            if (onNodeSelect) {
                graphRef.current.on('nodeDoubleClick', (event: NodeEvent) => {
                    if (event.nodeData) {
                        onNodeSelect(event.nodeData);
                    }
                });
            }
            
            if (onFilterChange) {
                graphRef.current.on('filtered', (event) => {
                    if (event.visibleNodes) {
                        onFilterChange(event.visibleNodes);
                    }
                });
            }
            
            // Apply custom theme if provided
            if (typeof theme === 'object') {
                graphRef.current.setTheme(theme);
            }
            
            setIsLoading(false);
            
        } catch (error) {
            console.error('Failed to create graph:', error);
            setIsLoading(false);
        }
        
        // Cleanup
        return () => {
            graphRef.current?.destroy();
            graphRef.current = null;
        };
    }, []);
    
    // Update data when props change
    useEffect(() => {
        if (graphRef.current && !isLoading) {
            graphRef.current.setData(data);
        }
    }, [data, isLoading]);
    
    // Update theme when it changes
    useEffect(() => {
        if (graphRef.current && !isLoading) {
            graphRef.current.setTheme(theme);
        }
    }, [theme, isLoading]);
    
    return (
        <div 
            ref={containerRef}
            id={`graph-${Math.random().toString(36).substr(2, 9)}`}
            className={className}
            style={{ width: '100%', height: '600px' }}
        >
            {isLoading && <div>Loading graph...</div>}
        </div>
    );
};

// Usage with full type safety
const App: React.FC = () => {
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [visibleCount, setVisibleCount] = useState<number>(0);
    
    const handleNodeSelect = (node: NodeData) => {
        setSelectedNode(node);
        console.log('Selected:', node.name);
    };
    
    const handleFilterChange = (visibleNodes: string[]) => {
        setVisibleCount(visibleNodes.length);
    };
    
    return (
        <div>
            <GraphComponent
                data={graphData}
                theme="dark"
                onNodeSelect={handleNodeSelect}
                onFilterChange={handleFilterChange}
            />
            
            {selectedNode && (
                <div>
                    <h3>Selected Node:</h3>
                    <p>Name: {selectedNode.name}</p>
                    <p>Type: {selectedNode.type}</p>
                </div>
            )}
            
            <p>Visible nodes: {visibleCount}</p>
        </div>
    );
};
```

## Type Utilities and Helpers

### 1. Type Guards

```typescript
import { NodeData, LinkData, GraphEvent, NodeEvent } from 'svg-graph-network';

// Type guard for node events
function isNodeEvent(event: GraphEvent): event is NodeEvent {
    return event.type.startsWith('node');
}

// Type guard for custom node types
function isEmployeeNode(node: NodeData): node is EmployeeNode {
    return 'department' in node && 'role' in node;
}

// Usage
graph.on('*', (event: GraphEvent) => {
    if (isNodeEvent(event)) {
        // TypeScript now knows this is a NodeEvent
        console.log('Node event:', event.nodeId);
    }
});
```

### 2. Utility Types

```typescript
import { NodeData, LinkData } from 'svg-graph-network';

// Extract node types from your data
type ExtractNodeTypes<T extends NodeData> = T['type'];
type MyNodeTypes = ExtractNodeTypes<EmployeeNode>; // string

// Create lookup types
type NodeTypeMap = {
    [K in MyNodeTypes]: NodeStyleConfig;
};

// Ensure all node types have styles
const nodeStyles: NodeTypeMap = {
    'executive': { fill: '#gold' },
    'manager': { fill: '#blue' },
    'employee': { fill: '#green' }
    // TypeScript will error if any type is missing
};
```

### 3. Configuration Validation

```typescript
import { GraphConfig } from 'svg-graph-network';

// Validate configuration at compile time
function createValidatedConfig(config: GraphConfig): GraphConfig {
    // TypeScript ensures all required fields are present
    if (config.damping < 0 || config.damping > 1) {
        throw new Error('Damping must be between 0 and 1');
    }
    
    return config;
}

// Usage
const validConfig = createValidatedConfig({
    damping: 0.95,
    repulsionStrength: 6500,
    attractionStrength: 0.001,
    groupingStrength: 0.001,
    zoomSensitivity: 1.01,
    filterDepth: 1,
    showControls: true,
    showLegend: true,
    showTitle: true,
    showBreadcrumbs: true,
    theme: 'dark',
    title: 'My Graph'
});
```

## Best Practices

### 1. Interface Segregation

```typescript
// Separate interfaces for different concerns
interface GraphNodeData extends NodeData {
    // Core data only
}

interface UINodeData extends GraphNodeData {
    // UI-specific properties
    tooltip?: string;
    icon?: string;
}

interface BusinessNodeData extends UINodeData {
    // Business logic properties
    metadata: Record<string, unknown>;
    permissions: string[];
}
```

### 2. Error Handling

```typescript
import { 
    NodeValidationError, 
    EdgeValidationError,
    NodeNotFoundError 
} from 'svg-graph-network';

try {
    graph.addNode(nodeData);
} catch (error) {
    if (error instanceof NodeValidationError) {
        console.error('Invalid node data:', error.message);
    } else if (error instanceof NodeNotFoundError) {
        console.error('Node not found:', error.nodeId);
    } else {
        console.error('Unexpected error:', error);
    }
}
```

### 3. Performance Optimization

```typescript
import { BulkUpdateOptions } from 'svg-graph-network';

// Batch operations for better performance
const batchOptions: BulkUpdateOptions = {
    skipRedraw: true,
    skipValidation: false, // Keep validation for safety
    animate: false
};

// Add many nodes efficiently
const newNodes: NodeData[] = generateLargeDataset();
graph.startBatch();
newNodes.forEach(node => graph.addNode(node, batchOptions));
graph.endBatch(); // Single redraw
```

This comprehensive TypeScript guide ensures you can leverage the full power of static typing while using the SVG Graph Network library.