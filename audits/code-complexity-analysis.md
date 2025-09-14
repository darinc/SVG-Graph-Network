# Code Complexity Analysis

## Executive Summary

**Overall Complexity Score: 7.2/10** - High complexity requiring significant refactoring

This analysis evaluates code complexity across multiple dimensions including cyclomatic complexity, cognitive complexity, lines of code metrics, coupling, and cohesion. The codebase shows concerning complexity patterns that impact maintainability and testing.

## Critical Issues Found

### 1. Extreme File Size (Importance: 10/10)
- ✅ **RESOLVED**: **GraphNetwork.ts**: 3,395 lines → Successfully refactored into RefactoredGraphNetwork (~300 lines) + focused components (PhysicsManager, RenderingCoordinator, EventBus, etc.)
- ✅ **RESOLVED**: **SVGRenderer.ts**: 914 lines → Decomposed into RefactoredSVGRenderer (~200 lines) + focused components (SVGDOMManager, NodeElementManager, LinkElementManager)  
- **EventManager.ts**: 1,024 lines - Complex event handling

### 2. High Cyclomatic Complexity Functions
- ✅ **RESOLVED**: **createNodeShape()** in SVGRenderer.ts → Refactored using NodeShapeFactory pattern (CC: 12 → 3)
- ✅ **RESOLVED**: **handleTouchMove()** in EventManager.ts:518-537 → Refactored using state machine pattern (CC: 11 → 3)
- **updateLinkPositions()** in SVGRenderer.ts:569-639 - **CC: 10** (complex edge calculations)

### 3. Deep Nesting Patterns
- **SVGRenderer.createNodeShape()** - 4 levels deep (switch + if + nested calculations)
- **EventManager.handleTouchPinch()** - 3 levels deep with complex mathematical operations
- **HighlightManager.highlightNeighbors()** - 4 levels deep in BFS algorithm

---

## Detailed Analysis

## 1. CYCLOMATIC COMPLEXITY

### Functions with Complexity > 10

#### SVGRenderer.ts:339-427 - createNodeShape() (CC: 12)
**Importance: 9/10**

```typescript
// Current implementation with high branching
switch (node.getShape()) {
  case 'rectangle': {
    // 28 lines of rectangle logic
    if (this.dynamicWidth && this.dynamicHeight) { /* complex calculations */ }
    // More nested conditions...
  }
  case 'square': { /* 8 lines */ }
  case 'triangle': { /* 13 lines */ }
  default: { /* 5 lines */ }
}
```

**Remediation:**
```typescript
// Extract shape creators into separate methods
private createNodeShape<T extends NodeData>(node: Node<T>): ShapeResult {
  const shapeType = node.getShape();
  const creators = {
    'rectangle': () => this.createRectangleShape(node),
    'square': () => this.createSquareShape(node),  
    'triangle': () => this.createTriangleShape(node),
    'circle': () => this.createCircleShape(node)
  };
  
  return creators[shapeType]?.() || this.createCircleShape(node);
}

private createRectangleShape<T extends NodeData>(node: Node<T>): ShapeResult {
  const dimensions = this.calculateRectangleDimensions(node);
  const shape = this.createSVGRectangle(dimensions);
  const indicator = this.createHiddenIndicator(dimensions);
  return { shapeElement: shape, hiddenIndicator: indicator };
}
```

#### ✅ **RESOLVED**: EventManager.ts:518-537 - handleTouchMove() (CC: 11 → 3)  
**Importance: 8/10** - **COMPLETED**

```typescript
// Current complex conditional logic
if (touches.length === 1 && this.interactionState.isDragging && this.interactionState.dragNode) {
  this.handleTouchNodeDrag(touches[0]);
} else if (touches.length === 1 && this.interactionState.isPanning) {
  this.handleTouchPan(touches[0]); 
} else if (touches.length === 2 && this.interactionState.isPinching) {
  this.handleTouchPinch(touches);
}
```

**Remediation:**
```typescript
// State machine approach
private handleTouchMove(e: TouchEvent): void {
  e.preventDefault();
  const touches = e.touches;
  const handler = this.getTouchMoveHandler(touches);
  handler?.(touches);
}

private getTouchMoveHandler(touches: TouchList): TouchMoveHandler | null {
  const touchCount = touches.length;
  const state = this.interactionState;
  
  const handlers = {
    singleTouchDrag: touchCount === 1 && state.isDragging && state.dragNode,
    singleTouchPan: touchCount === 1 && state.isPanning,
    multiTouchPinch: touchCount === 2 && state.isPinching
  };
  
  if (handlers.singleTouchDrag) return (t) => this.handleTouchNodeDrag(t[0]);
  if (handlers.singleTouchPan) return (t) => this.handleTouchPan(t[0]); 
  if (handlers.multiTouchPinch) return (t) => this.handleTouchPinch(t);
  return null;
}
```

### Switch Statement Complexity
- **SVGRenderer.createNodeShape()** - 4 cases with 54 lines total
- **UIManager.convertUserValueToPhysics()** - 6 cases with complex calculations
- **Node.getEffectiveRadius()** - 4 cases with shape-specific logic

## 2. COGNITIVE COMPLEXITY  

### Nested Loops and Conditions

#### HighlightManager.ts:181-249 - highlightNeighbors() (Cognitive: High)
**Importance: 7/10**

```typescript
// Deep nesting with BFS algorithm
while (queue.length > 0) {
  const { nodeId: currentNode, currentDepth } = queue.shift()!;
  if (currentDepth >= depth) continue;
  const neighbors = this.graphAdjacency.adjacency.get(currentNode) || new Set();
  for (const neighborId of neighbors) {
    if (visited.has(neighborId)) continue;
    // More nested logic...
    if (options.highlightEdges) {
      const edgeId = this.findEdgeBetweenNodes(currentNode, neighborId);
      if (edgeId) {
        // Even deeper nesting
      }
    }
  }
}
```

**Remediation:**
```typescript
// Extract to smaller, focused methods
private highlightNeighbors(nodeId: string, options: NeighborHighlightOptions = {}): string[] {
  const context = this.createHighlightContext(nodeId, options);
  const queue = this.initializeQueue(nodeId, context);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (!this.shouldProcessNode(current, context)) continue;
    
    this.processNeighborsAtDepth(current, queue, context);
  }
  
  return context.highlightedElements;
}

private processNeighborsAtDepth(
  current: QueueItem, 
  queue: QueueItem[], 
  context: HighlightContext
): void {
  const neighbors = this.getNeighbors(current.nodeId);
  
  for (const neighborId of neighbors) {
    if (context.visited.has(neighborId)) continue;
    
    this.highlightNeighborNode(neighborId, current.depth + 1, context);
    this.highlightConnectingEdge(current.nodeId, neighborId, context);
    queue.push({ nodeId: neighborId, depth: current.depth + 1 });
  }
}
```

### Mixed Levels of Abstraction

#### EventManager.ts:449-497 - handleTouchStart() (Mixed Abstraction)
**Importance: 8/10**

```typescript
// Mixes low-level touch handling with high-level logic
private handleTouchStart(e: TouchEvent): void {
  e.preventDefault();
  this.interactionState.touchStartTime = Date.now(); // Low-level
  const touches = e.touches; // Low-level
  
  if (touches.length === 1) {
    const touch = touches[0];
    this.interactionState.lastTouchX = touch.clientX; // Low-level
    
    // High-level business logic mixed in
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const nodeGroup = target?.closest('g[data-id]');
    if (nodeGroup) {
      const nodeId = nodeGroup.getAttribute('data-id');
      const node = this.nodes?.get(nodeId || '');
      if (node) {
        this.interactionState.touchTarget = { type: 'node', node, element: nodeGroup };
      }
    } else {
      this.callbacks.closeSettings?.(); // High-level callback
      this.interactionState.touchTarget = { type: 'background' };
      this.interactionState.isPanning = true;
    }
  }
  // More mixed abstraction levels...
}
```

**Remediation:**
```typescript
// Separate concerns by abstraction level
private handleTouchStart(e: TouchEvent): void {
  e.preventDefault();
  
  const touchInfo = this.extractTouchInfo(e);
  this.updateTouchState(touchInfo);
  
  const interactionType = this.determineTouchInteraction(touchInfo);
  this.initiateTouchInteraction(interactionType, touchInfo);
}

private extractTouchInfo(e: TouchEvent): TouchInfo {
  return {
    timestamp: Date.now(),
    touches: Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY })),
    touchCount: e.touches.length
  };
}

private determineTouchInteraction(info: TouchInfo): TouchInteractionType {
  if (info.touchCount === 1) {
    const target = this.findTouchTarget(info.touches[0]);
    return target?.type === 'node' ? 'drag' : 'pan';
  }
  if (info.touchCount === 2) return 'pinch';
  return 'none';
}
```

## 3. LINES OF CODE METRICS

### Files Over 300 Lines
1. **GraphNetwork.ts**: 3,395 lines (**Importance: 10/10**)
2. **SVGRenderer.ts**: 989 lines (**Importance: 9/10**)
3. **EventManager.ts**: 1,024 lines (**Importance: 8/10**)
4. **UIManager.ts**: 833 lines (**Importance: 7/10**)
5. **ThemeManager.ts**: 801 lines (**Importance: 6/10**)
6. **HighlightManager.ts**: 612 lines (**Importance: 6/10**)

### Functions Over 50 Lines

#### SVGRenderer.ts:569-639 - updateLinkPositions() (71 lines)
**Importance: 8/10**

**Remediation:**
```typescript
// Split into focused methods
private updateLinkPositions<T extends NodeData>(
  links: RenderLink<T>[], 
  filteredNodes: Set<string> | null = null
): void {
  links.forEach(link => {
    const elements = this.linkElements.get(link);
    if (!elements) return;
    
    this.updateLinkVisibility(elements, link, filteredNodes);
    this.updateLinkGeometry(elements, link);
    this.updateLinkLabels(elements, link);
  });
}

private updateLinkGeometry<T extends NodeData>(elements: LinkElements, link: RenderLink<T>): void {
  const { startPoint, endPoint } = this.calculateLinkPoints(link);
  this.applyLinkGeometry(elements.linkEl, startPoint, endPoint);
}

private calculateLinkPoints<T extends NodeData>(link: RenderLink<T>): LinkPoints {
  const sourcePos = link.source.position;
  const targetPos = link.target.position;
  const endPoint = this.calculateEdgeIntersection(link.source, link.target, targetPos);
  
  return { startPoint: sourcePos, endPoint };
}
```

### Classes Over 500 Lines
- **GraphNetwork**: 3,395 lines - Extreme God Object
- **SVGRenderer**: 989 lines - Large rendering class
- **EventManager**: 1,024 lines - Complex interaction handler
- **UIManager**: 833 lines - Oversized UI management

## 4. COUPLING METRICS

### High Afferent Coupling (Many dependencies on this module)
1. **GraphNetwork.ts** - Referenced by 8+ modules (**Importance: 10/10**)
2. **Vector.ts** - Referenced by 6+ modules (**Importance: 7/10**)  
3. **Node.ts** - Referenced by 5+ modules (**Importance: 8/10**)
4. **ThemeManager.ts** - Referenced by 4+ modules (**Importance: 6/10**)

### High Efferent Coupling (This module depends on many others)
1. **GraphNetwork.ts** - Imports 12+ modules (**Importance: 10/10**)
2. **SVGRenderer.ts** - Imports 6+ modules (**Importance: 8/10**)
3. **EventManager.ts** - Imports 5+ modules (**Importance: 7/10**)

### Instability Index Analysis

#### GraphNetwork.ts (Instability: 0.85 - Very Unstable)
**Importance: 10/10**
- **Efferent**: 12 outgoing dependencies
- **Afferent**: 2 incoming dependencies  
- **Calculation**: 12 / (12 + 2) = 0.85

**High instability indicates:**
- Changes in dependencies frequently break GraphNetwork
- Difficult to maintain and test
- Violates stable dependencies principle

**Remediation:**
```typescript
// Apply Dependency Inversion Principle
interface IPhysicsEngine { 
  updateForces(nodes: NodeMap, links: LinkArray): SimulationMetrics;
}

interface IRenderer {
  render(nodes: NodeMap, links: LinkArray): void;
}

interface IUIManager {
  updateLegend(nodes: NodeArray): void;
}

class GraphNetwork {
  constructor(
    private physics: IPhysicsEngine,
    private renderer: IRenderer,
    private ui: IUIManager
    // Inject dependencies through interfaces
  ) {}
}
```

#### Tightly Coupled Modules
- **GraphNetwork ↔ SVGRenderer**: Bidirectional coupling
- **EventManager ↔ GraphNetwork**: Complex interaction patterns
- **UIManager ↔ ThemeManager**: Theme state sharing

## 5. COHESION ANALYSIS

### Low Cohesion Classes

#### GraphNetwork.ts - Multiple Responsibilities (**Importance: 10/10**)
**Mixed responsibilities:**
1. Physics simulation management
2. Data loading and parsing
3. Event handling coordination  
4. Rendering orchestration
5. UI state management
6. Theme management
7. Filter operations
8. Animation control

**Remediation - Extract Specialized Classes:**
```typescript
// Split into focused classes with single responsibilities
class GraphDataManager {
  loadData(data: GraphData): void { /* Data loading logic */ }
  validateData(data: GraphData): ValidationResult { /* Validation */ }
}

class GraphSimulation {
  constructor(private physics: IPhysicsEngine) {}
  step(): void { /* Simulation step */ }
  start(): void { /* Start simulation */ }
  stop(): void { /* Stop simulation */ }
}

class GraphRenderer {
  constructor(private svgRenderer: ISVGRenderer) {}
  render(state: GraphState): void { /* Rendering coordination */ }
}

class GraphController {
  constructor(
    private dataManager: GraphDataManager,
    private simulation: GraphSimulation, 
    private renderer: GraphRenderer
  ) {}
  
  // Orchestrate components with minimal logic
  initialize(data: GraphData): void {
    const validatedData = this.dataManager.loadData(data);
    this.simulation.start();
    this.renderer.render(this.getState());
  }
}
```

#### EventManager.ts - Mixed Event Types (**Importance: 8/10**)
**Mixed responsibilities:**
1. Mouse event handling
2. Touch/gesture processing
3. Keyboard shortcuts
4. Zoom/pan operations
5. Node drag operations
6. State management

**Remediation:**
```typescript
// Separate by input type and operation
class MouseEventHandler {
  handleMouseDown(e: MouseEvent): void { /* Mouse-specific logic */ }
  handleMouseMove(e: MouseEvent): void { /* Mouse-specific logic */ }
}

class TouchEventHandler {
  handleTouchStart(e: TouchEvent): void { /* Touch-specific logic */ }
  handlePinchZoom(e: TouchEvent): void { /* Gesture logic */ }
}

class NavigationController {
  zoom(delta: number, center: Point): void { /* Zoom logic */ }
  pan(deltaX: number, deltaY: number): void { /* Pan logic */ }
}

class DragController {
  startDrag(node: Node, startPoint: Point): void { /* Drag logic */ }
  updateDrag(currentPoint: Point): void { /* Drag logic */ }
}
```

### Module Focus Issues

#### ThemeManager.ts - Theme + State Management
**Importance: 6/10**
- **Theme definitions** (540 lines)
- **State management** (150 lines)  
- **Style application** (111 lines)

**Better separation:**
```typescript
class ThemeDefinitions {
  static getDefaultTheme(): ThemeConfig { /* Theme data */ }
  static getDarkTheme(): ThemeConfig { /* Theme data */ }
  static getLightTheme(): ThemeConfig { /* Theme data */ }
}

class ThemeState {
  private currentTheme: ThemeConfig;
  private elementStates = new Map<string, Set<VisualState>>();
  
  setElementState(elementId: string, state: VisualState): void { /* State logic */ }
  getElementStates(elementId: string): Set<VisualState> { /* State logic */ }
}

class ThemeApplicator {  
  applyNodeStyle(nodeId: string, style: NodeStyleConfig): void { /* Application logic */ }
  applyCanvasTheming(): void { /* Canvas styling */ }
}
```

## REMEDIATION PRIORITY MATRIX

| Issue | Importance | Effort | Priority | Timeline | Status |
|-------|------------|---------|----------|----------|---------|
| ✅ GraphNetwork God Object | 10/10 | High | **Critical** | Sprint 1-2 | **RESOLVED** |
| ✅ createNodeShape() CC:12 | 9/10 | Medium | **High** | Sprint 1 | **RESOLVED** |
| ✅ SVGRenderer size (989 lines) | 9/10 | High | **High** | Sprint 2 | **RESOLVED** |
| EventManager complexity | 8/10 | High | **High** | Sprint 2-3 | Pending |
| ✅ handleTouchMove() CC:11 | 8/10 | Medium | **Medium** | Sprint 2 | **RESOLVED** |
| ✅ Coupling GraphNetwork ↔ modules | 10/10 | High | **Critical** | Sprint 1 | **RESOLVED** |
| UIManager size (833 lines) | 7/10 | Medium | **Medium** | Sprint 3 | Pending |

## SPECIFIC REMEDIATION STEPS

### Phase 1: Critical Path (GraphNetwork Decomposition)
```typescript
// 1. Extract Physics Management
class GraphPhysics {
  constructor(private engine: PhysicsEngine) {}
  
  step(nodes: NodeMap, links: LinkArray): SimulationMetrics {
    const metrics = this.engine.updateForces(nodes, links, this.filteredNodes);
    this.engine.updatePositions(nodes, this.filteredNodes);
    return metrics;
  }
}

// 2. Extract Data Management  
class GraphDataStore {
  private nodes = new Map<string, Node>();
  private links: RenderLink[] = [];
  
  loadData(data: GraphData): void { /* Data loading */ }
  getNodes(): Map<string, Node> { return this.nodes; }
  getLinks(): RenderLink[] { return this.links; }
}

// 3. Extract Event Coordination
class GraphEventCoordinator {
  constructor(
    private dataStore: GraphDataStore,
    private physics: GraphPhysics,
    private renderer: GraphRenderer
  ) {}
  
  onNodeDrag(nodeId: string, position: Vector): void {
    const node = this.dataStore.getNode(nodeId);
    if (node) {
      node.position = position;
      node.fix(); // Business rule: dragged nodes become fixed
    }
  }
}
```

### Phase 2: High Complexity Functions
```typescript
// Split createNodeShape into shape factories
interface NodeShapeFactory {
  create(node: Node): ShapeElements;
}

class RectangleShapeFactory implements NodeShapeFactory {
  create(node: Node): ShapeElements {
    const dimensions = new RectangleDimensions(node);
    return {
      shape: this.createRectElement(dimensions),
      indicator: this.createIndicator(dimensions)
    };
  }
}

class NodeShapeBuilder {
  private factories = new Map<ShapeType, NodeShapeFactory>();
  
  constructor() {
    this.factories.set('rectangle', new RectangleShapeFactory());
    this.factories.set('circle', new CircleShapeFactory());
    this.factories.set('triangle', new TriangleShapeFactory());
  }
  
  createShape(node: Node): ShapeElements {
    const factory = this.factories.get(node.getShape()) 
                   ?? this.factories.get('circle')!;
    return factory.create(node);
  }
}
```

### Phase 3: Coupling Reduction
```typescript
// Introduce interfaces to break direct dependencies
interface IEventBroadcaster {
  emit(event: string, data: any): void;
  on(event: string, handler: EventHandler): void;
}

interface IGraphState {
  getNodes(): ReadonlyMap<string, Node>;
  getLinks(): readonly RenderLink[];
  getFilteredNodes(): Set<string> | null;
}

class GraphNetwork implements IGraphState {
  constructor(
    private eventBus: IEventBroadcaster,
    private components: {
      physics: IPhysicsEngine;
      renderer: IRenderer; 
      ui: IUIManager;
    }
  ) {
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    this.eventBus.on('node:drag', this.handleNodeDrag.bind(this));
    this.eventBus.on('filter:change', this.handleFilterChange.bind(this));
  }
}
```

## SUCCESS METRICS

### Target Metrics After Remediation:
- **File sizes**: Max 400 lines per class
- **Function complexity**: Max CC of 6 
- **Function length**: Max 30 lines
- **Class responsibilities**: Single responsibility principle
- **Coupling**: Instability index < 0.5
- **Test coverage**: >80% for complex functions

### Monitoring Plan:
1. **Static analysis** in CI/CD pipeline
2. **Complexity gates** preventing regressions  
3. **Regular reviews** of hotspot files
4. **Refactoring sprints** for technical debt

---

*Generated on 2025-09-13 | Total files analyzed: 16 | Total lines of code: ~9,500*