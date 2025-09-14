/**
 * EventBus - Centralized event system for inter-module communication
 *
 * Extracted from GraphNetwork to reduce God Object anti-pattern.
 * Provides clean decoupling between modules through event-driven architecture.
 */

/**
 * Event handler function signature
 */
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

/**
 * Event subscription interface
 */
export interface EventSubscription {
    unsubscribe(): void;
}

/**
 * Event metadata for debugging and monitoring
 */
export interface EventMetadata {
    timestamp: number;
    source?: string;
    target?: string;
    priority?: number;
}

/**
 * Event with metadata
 */
export interface EventWithMetadata<T = unknown> {
    data: T;
    metadata: EventMetadata;
}

/**
 * Event bus configuration
 */
export interface EventBusConfig {
    enableLogging?: boolean;
    maxListeners?: number;
    enableMetrics?: boolean;
}

/**
 * Event bus metrics
 */
export interface EventBusMetrics {
    totalEvents: number;
    eventsByType: Map<string, number>;
    activeSubscriptions: number;
    averageHandlerTime: number;
    errorCount: number;
}

/**
 * EventBus handles all inter-module communication for graph networks
 *
 * Responsibilities:
 * - Manages event subscriptions and publishing
 * - Provides type-safe event handling
 * - Tracks event metrics and performance
 * - Handles error recovery and logging
 * - Supports priority-based event handling
 */
export class EventBus {
    private listeners = new Map<string, Set<EventHandler>>();
    private onceListeners = new Map<string, Set<EventHandler>>();
    private config: EventBusConfig;
    private metrics: EventBusMetrics;
    private handlerTimes: number[] = [];
    private maxHandlerTimeHistory = 100;

    constructor(config: EventBusConfig = {}) {
        this.config = {
            enableLogging: false,
            maxListeners: 100,
            enableMetrics: true,
            ...config
        };

        this.metrics = {
            totalEvents: 0,
            eventsByType: new Map(),
            activeSubscriptions: 0,
            averageHandlerTime: 0,
            errorCount: 0
        };
    }

    /**
     * Subscribe to an event
     *
     * @param eventType - Type of event to listen for
     * @param handler - Function to call when event is emitted
     * @param options - Subscription options
     * @returns Subscription object with unsubscribe method
     */
    on<T = unknown>(
        eventType: string,
        handler: EventHandler<T>,
        options: { once?: boolean; priority?: number } = {}
    ): EventSubscription {
        const { once = false } = options;

        // Check listener limits
        if (this.getTotalListeners() >= (this.config.maxListeners || 100)) {
            console.warn(
                `EventBus: Maximum listeners (${this.config.maxListeners}) reached for event type: ${eventType}`
            );
        }

        const listenersMap = once ? this.onceListeners : this.listeners;

        if (!listenersMap.has(eventType)) {
            listenersMap.set(eventType, new Set());
        }

        const eventListeners = listenersMap.get(eventType)!;
        eventListeners.add(handler as EventHandler);

        this.metrics.activeSubscriptions++;

        if (this.config.enableLogging) {
            console.log(`EventBus: Subscribed to '${eventType}' (${once ? 'once' : 'persistent'})`);
        }

        // Return unsubscribe function
        return {
            unsubscribe: () => {
                const wasDeleted = eventListeners.delete(handler as EventHandler);
                if (wasDeleted) {
                    this.metrics.activeSubscriptions--;
                }

                if (eventListeners.size === 0) {
                    listenersMap.delete(eventType);
                }

                if (this.config.enableLogging && wasDeleted) {
                    console.log(`EventBus: Unsubscribed from '${eventType}'`);
                }
            }
        };
    }

    /**
     * Subscribe to an event for one occurrence only
     */
    once<T = unknown>(eventType: string, handler: EventHandler<T>): EventSubscription {
        return this.on(eventType, handler, { once: true });
    }

    /**
     * Emit an event to all subscribers
     *
     * @param eventType - Type of event to emit
     * @param data - Data to send with the event
     * @param metadata - Optional metadata for the event
     * @returns Promise that resolves when all handlers complete
     */
    async emit<T = unknown>(
        eventType: string,
        data: T,
        metadata: Partial<EventMetadata> = {}
    ): Promise<void> {
        const startTime = performance.now();

        const eventMetadata: EventMetadata = {
            timestamp: Date.now(),
            ...metadata
        };

        const eventWithMetadata: EventWithMetadata<T> = {
            data,
            metadata: eventMetadata
        };

        // Update metrics
        this.metrics.totalEvents++;
        const currentCount = this.metrics.eventsByType.get(eventType) || 0;
        this.metrics.eventsByType.set(eventType, currentCount + 1);

        if (this.config.enableLogging) {
            console.log(`EventBus: Emitting '${eventType}'`, data);
        }

        // Collect all handlers
        const persistentHandlers = this.listeners.get(eventType) || new Set();
        const onceHandlers = this.onceListeners.get(eventType) || new Set();

        const allHandlers = [...persistentHandlers, ...onceHandlers];

        // Remove once handlers immediately
        if (onceHandlers.size > 0) {
            this.onceListeners.delete(eventType);
            this.metrics.activeSubscriptions -= onceHandlers.size;
        }

        // Execute all handlers
        const handlerPromises = allHandlers.map(async handler => {
            try {
                const handlerStartTime = performance.now();
                await handler(eventWithMetadata.data);
                const handlerTime = performance.now() - handlerStartTime;
                this.trackHandlerTime(handlerTime);
            } catch (error) {
                this.metrics.errorCount++;
                console.error(`EventBus: Error in handler for '${eventType}':`, error);
            }
        });

        try {
            await Promise.all(handlerPromises);
        } catch (error) {
            // Individual handler errors are already logged above
            // This catch is for any Promise.all specific errors
            console.error(`EventBus: Error during event '${eventType}' emission:`, error);
        }

        const totalTime = performance.now() - startTime;
        if (this.config.enableLogging && totalTime > 10) {
            console.warn(
                `EventBus: Event '${eventType}' took ${totalTime.toFixed(2)}ms to process`
            );
        }
    }

    /**
     * Emit an event synchronously (not recommended for async handlers)
     */
    emitSync<T = unknown>(eventType: string, data: T): void {
        const persistentHandlers = this.listeners.get(eventType) || new Set();
        const onceHandlers = this.onceListeners.get(eventType) || new Set();

        // Remove once handlers
        if (onceHandlers.size > 0) {
            this.onceListeners.delete(eventType);
            this.metrics.activeSubscriptions -= onceHandlers.size;
        }

        // Execute handlers synchronously
        [...persistentHandlers, ...onceHandlers].forEach(handler => {
            try {
                const result = handler(data);
                if (result instanceof Promise) {
                    console.warn(`EventBus: Async handler called with emitSync for '${eventType}'`);
                }
            } catch (error) {
                this.metrics.errorCount++;
                console.error(`EventBus: Error in sync handler for '${eventType}':`, error);
            }
        });

        this.metrics.totalEvents++;
        const currentCount = this.metrics.eventsByType.get(eventType) || 0;
        this.metrics.eventsByType.set(eventType, currentCount + 1);
    }

    /**
     * Remove all listeners for a specific event type
     */
    off(eventType: string): void {
        const persistentCount = this.listeners.get(eventType)?.size || 0;
        const onceCount = this.onceListeners.get(eventType)?.size || 0;

        this.listeners.delete(eventType);
        this.onceListeners.delete(eventType);

        this.metrics.activeSubscriptions -= persistentCount + onceCount;

        if (this.config.enableLogging) {
            console.log(`EventBus: Removed all listeners for '${eventType}'`);
        }
    }

    /**
     * Remove all listeners from the event bus
     */
    removeAllListeners(): void {
        this.listeners.clear();
        this.onceListeners.clear();
        this.metrics.activeSubscriptions = 0;

        if (this.config.enableLogging) {
            console.log('EventBus: Removed all listeners');
        }
    }

    /**
     * Get list of all event types with active listeners
     */
    getEventTypes(): string[] {
        const persistentTypes = Array.from(this.listeners.keys());
        const onceTypes = Array.from(this.onceListeners.keys());
        return [...new Set([...persistentTypes, ...onceTypes])];
    }

    /**
     * Get number of listeners for a specific event type
     */
    getListenerCount(eventType: string): number {
        const persistentCount = this.listeners.get(eventType)?.size || 0;
        const onceCount = this.onceListeners.get(eventType)?.size || 0;
        return persistentCount + onceCount;
    }

    /**
     * Get total number of active listeners
     */
    getTotalListeners(): number {
        return this.metrics.activeSubscriptions;
    }

    /**
     * Get event bus metrics
     */
    getMetrics(): EventBusMetrics {
        return {
            ...this.metrics,
            eventsByType: new Map(this.metrics.eventsByType)
        };
    }

    /**
     * Reset event bus metrics
     */
    resetMetrics(): void {
        this.metrics = {
            totalEvents: 0,
            eventsByType: new Map(),
            activeSubscriptions: this.getTotalListeners(),
            averageHandlerTime: 0,
            errorCount: 0
        };
        this.handlerTimes = [];
    }

    /**
     * Check if event bus has listeners for a specific event type
     */
    hasListeners(eventType: string): boolean {
        return this.getListenerCount(eventType) > 0;
    }

    /**
     * Create a scoped event bus for a specific namespace
     */
    createNamespace(namespace: string): NamespacedEventBus {
        return new NamespacedEventBus(this, namespace);
    }

    /**
     * Track handler execution time for performance metrics
     * @private
     */
    private trackHandlerTime(time: number): void {
        if (!this.config.enableMetrics) return;

        this.handlerTimes.push(time);

        if (this.handlerTimes.length > this.maxHandlerTimeHistory) {
            this.handlerTimes.shift();
        }

        const sum = this.handlerTimes.reduce((a, b) => a + b, 0);
        this.metrics.averageHandlerTime = sum / this.handlerTimes.length;
    }

    /**
     * Clean up event bus resources
     */
    destroy(): void {
        this.removeAllListeners();
        this.resetMetrics();
    }

    /**
     * Factory method to create EventBus
     */
    static create(config: EventBusConfig = {}): EventBus {
        return new EventBus(config);
    }
}

/**
 * Namespaced event bus for module-specific events
 */
export class NamespacedEventBus {
    constructor(
        private parentBus: EventBus,
        private namespace: string
    ) {}

    private getNamespacedEvent(eventType: string): string {
        return `${this.namespace}:${eventType}`;
    }

    on<T = unknown>(eventType: string, handler: EventHandler<T>): EventSubscription {
        return this.parentBus.on(this.getNamespacedEvent(eventType), handler);
    }

    once<T = unknown>(eventType: string, handler: EventHandler<T>): EventSubscription {
        return this.parentBus.once(this.getNamespacedEvent(eventType), handler);
    }

    async emit<T = unknown>(eventType: string, data: T): Promise<void> {
        return this.parentBus.emit(this.getNamespacedEvent(eventType), data, {
            source: this.namespace
        });
    }

    emitSync<T = unknown>(eventType: string, data: T): void {
        return this.parentBus.emitSync(this.getNamespacedEvent(eventType), data);
    }

    off(eventType: string): void {
        return this.parentBus.off(this.getNamespacedEvent(eventType));
    }

    hasListeners(eventType: string): boolean {
        return this.parentBus.hasListeners(this.getNamespacedEvent(eventType));
    }

    getListenerCount(eventType: string): number {
        return this.parentBus.getListenerCount(this.getNamespacedEvent(eventType));
    }
}
