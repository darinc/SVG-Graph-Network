/**
 * Core interfaces for dependency injection
 *
 * These interfaces define the contracts between different components
 * to reduce coupling and enable testability.
 */

import { Node } from '../Node';
// import { Vector } from '../Vector';
import {
    NodeData,
    EdgeData,
    LinkData,
    GraphData,
    TransformState,
    Position,
    InteractionConfig,
    GraphConfig,
    TooltipConfig,
    GraphStats
} from '../types/index';
import { RenderLink } from '../rendering/SVGRenderer';
import { AnimationMetrics } from './GraphAnimationController';

// ==================== CORE INTERFACES ====================

export interface IGraphDataManager<T extends NodeData = NodeData> {
    addNode(nodeData: T, options?: any): Node<T>;
    deleteNode(nodeId: string, options?: any): boolean;
    getNode(nodeId: string): T | null;
    getNodeInstance(nodeId: string): Node<T> | null;
    hasNode(nodeId: string): boolean;
    getNodes(): T[];
    getNodeInstances(): Map<string, Node<T>>;

    addEdge(edgeData: EdgeData, options?: any): RenderLink<T>;
    deleteEdge(edgeId: string, options?: any): boolean;
    getEdge(edgeId: string): LinkData | null;
    hasEdge(edgeId: string): boolean;
    getLinks(): LinkData[];
    getRenderLinks(): RenderLink<T>[];

    setData(data: GraphData): void;
    mergeData(data: GraphData): void;
    clearData(): void;
    getData(): GraphData;

    getStats(): {
        nodeCount: number;
        edgeCount: number;
        isolatedNodes: number;
    };
}

export interface IGraphAnimationController {
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    isRunning(): boolean;
    isPaused(): boolean;
    getMetrics(): AnimationMetrics;
    setTargetFPS(fps: number): void;
    onFrame(callback: (deltaTime: number) => void): void;
    removeFrameCallback(callback: (deltaTime: number) => void): void;
}

export interface IPhysicsEngine {
    updateForces(
        nodes: Map<string, Node>,
        links: RenderLink[],
        filteredNodes?: Set<string> | null
    ): any;
    updatePositions(nodes: Map<string, Node>, filteredNodes?: Set<string> | null): void;
    getConfig(): any;
    updateConfig(config: any): void;
}

export interface IRenderer<T extends NodeData = NodeData> {
    initialize(container: HTMLElement): void;
    render(nodes: Map<string, Node<T>>, links: RenderLink<T>[]): void;
    updateTransform(x: number, y: number, scale: number): void;
    getContainer(): HTMLElement | null;
    getSVGElement(): SVGSVGElement | null;
    clear(): void;
    destroy(): void;
}

export interface IUIManager {
    initialize(container: HTMLElement): void;
    updateLegend(nodes: Node[]): void;
    showTooltip(node: Node, position?: Position): void;
    hideTooltip(): void;
    configureTooltip(config: Partial<TooltipConfig>): void;
    setDebugMode(enabled: boolean): void;
    updateDebugInfo(info: any): void;
    destroy(): void;
}

export interface IEventManager<T extends NodeData = NodeData> {
    initialize(svg: SVGSVGElement, nodes: Map<string, Node<T>>, callbacks?: any): void;
    setTransform(x: number, y: number, scale: number): void;
    getTransform(): TransformState;
    updateConfig(config: Partial<InteractionConfig>): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback: (...args: unknown[]) => void): void;
    emit(event: string, data?: any): void;
    isDragging(): boolean;
    isPanning(): boolean;
    destroy(): void;
}

export interface IThemeManager {
    getCurrentTheme(): string;
    setTheme(theme: string): void;
    toggleTheme(): string;
    getThemeConfig(): any;
    updateCanvasTheming(): void;
    applyNodeStyles(node: Node, element: SVGElement): void;
    applyEdgeStyles(edge: RenderLink, element: SVGElement): void;
    getNodeStyle(node: Node): any;
    getEdgeStyle(edge: RenderLink): any;
}

// ==================== EVENT SYSTEM INTERFACES ====================

export interface IEventBus {
    emit<T = any>(event: string, data: T): void;
    on<T = any>(event: string, handler: EventHandler<T>): void;
    off<T = any>(event: string, handler: EventHandler<T>): void;
    once<T = any>(event: string, handler: EventHandler<T>): void;
    removeAllListeners(event?: string): void;
    getRegisteredEvents(): string[];
}

export type EventHandler<T = any> = (data: T) => void;

// ==================== FACTORY INTERFACES ====================

export interface IComponentFactory<T extends NodeData = NodeData> {
    createDataManager(): IGraphDataManager<T>;
    createAnimationController(): IGraphAnimationController;
    createRenderer(): IRenderer<T>;
    createUIManager(): IUIManager;
    createEventManager(): IEventManager<T>;
    createThemeManager(): IThemeManager;
    createPhysicsEngine(): IPhysicsEngine;
    createEventBus(): IEventBus;
}

// ==================== CONFIGURATION INTERFACES ====================

export interface IGraphConfiguration {
    container: HTMLElement;
    data?: GraphData;
    config?: Partial<GraphConfig>;
    theme?: string;
    physics?: any;
    interaction?: Partial<InteractionConfig>;
    tooltip?: Partial<TooltipConfig>;
}

// ==================== SERVICE INTERFACES ====================

export interface IGraphService<T extends NodeData = NodeData> {
    // Data operations
    loadData(data: GraphData): Promise<void>;
    exportData(format: 'json' | 'csv' | 'png' | 'svg'): Promise<string | Blob>;

    // Graph operations
    filterByNode(nodeId: string, depth?: number): void;
    resetFilter(): void;
    resetLayout(): void;

    // View operations
    zoomToFit(padding?: number): Promise<void>;
    focusOnNode(nodeId: string): Promise<void>;

    // Animation control
    startAnimation(): void;
    stopAnimation(): void;

    // Configuration
    updateConfig(config: Partial<GraphConfig>): void;
    getConfig(): GraphConfig;

    // Stats and monitoring
    getStats(): GraphStats;
    getPerformanceMetrics(): AnimationMetrics;
}

// ==================== TRANSACTION INTERFACES ====================

export interface ITransactionManager {
    startTransaction(): string;
    commitTransaction(): { id: string; operationCount: number; duration: number };
    rollbackTransaction(): { id: string; operationCount: number; duration: number };
    isInTransaction(): boolean;
    getTransactionStatus(): {
        id: string | null;
        isActive: boolean;
        operationCount: number;
        startTime: number;
    };
}

// ==================== PLUGIN INTERFACES ====================

export interface IGraphPlugin<T extends NodeData = NodeData> {
    name: string;
    version: string;
    initialize(graph: IGraphService<T>): void;
    destroy(): void;
}

export interface IPluginManager<T extends NodeData = NodeData> {
    register(plugin: IGraphPlugin<T>): void;
    unregister(pluginName: string): void;
    getPlugin(name: string): IGraphPlugin<T> | null;
    getRegisteredPlugins(): string[];
    initializeAll(graph: IGraphService<T>): void;
    destroyAll(): void;
}

// ==================== DEPENDENCY INJECTION CONTAINER ====================

export interface IDependencyContainer {
    register<T>(key: string, factory: () => T): void;
    registerSingleton<T>(key: string, factory: () => T): void;
    registerInstance<T>(key: string, instance: T): void;
    resolve<T>(key: string): T;
    has(key: string): boolean;
    clear(): void;

    // Type-safe registration
    bind<T>(token: Token<T>): BindingBuilder<T>;
    get<T>(token: Token<T>): T;
}

export class Token<T> {
    constructor(public readonly name: string) {}
}

export interface BindingBuilder<T> {
    to(factory: () => T): void;
    toSingleton(factory: () => T): void;
    toInstance(instance: T): void;
}

// ==================== COMMON TYPES ====================

export type ServiceLifecycle = 'transient' | 'singleton' | 'scoped';

export interface ServiceDescriptor<T = any> {
    token: Token<T>;
    factory: () => T;
    lifecycle: ServiceLifecycle;
    instance?: T;
}

// ==================== ORCHESTRATION INTERFACES ====================

export interface IGraphOrchestrator<T extends NodeData = NodeData> {
    initialize(configuration: IGraphConfiguration): Promise<void>;
    start(): void;
    stop(): void;
    destroy(): void;

    // Component access
    getDataManager(): IGraphDataManager<T>;
    getAnimationController(): IGraphAnimationController;
    getRenderer(): IRenderer<T>;
    getUIManager(): IUIManager;
    getEventManager(): IEventManager<T>;
    getThemeManager(): IThemeManager;
    getPhysicsEngine(): IPhysicsEngine;
    getEventBus(): IEventBus;

    // High-level operations
    loadData(data: GraphData): Promise<void>;
    exportData(format: string): Promise<string | Blob>;
    updateConfiguration(config: Partial<GraphConfig>): void;
}

// ==================== UTILITY INTERFACES ====================

export interface ILogger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, error?: Error, ...args: any[]): void;
    setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void;
}

export interface IPerformanceMonitor {
    startTimer(name: string): void;
    endTimer(name: string): number;
    recordMetric(name: string, value: number): void;
    getMetrics(): Record<string, number[]>;
    clearMetrics(): void;
    getAverageMetric(name: string): number;
}
