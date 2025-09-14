/**
 * InteractionEventEmitter - Manages event emission for interaction events
 *
 * Extracted from EventManager to provide focused responsibility for:
 * - Event registration and deregistration
 * - Event emission with error handling
 * - Event listener management
 * - Event callback tracking
 */

import { NodeData } from '../../types/index';

export type EventCallback<T = any> = (data: T) => void;

/**
 * Manages event emission for interaction events
 */
export class InteractionEventEmitter<T extends NodeData = NodeData> {
    private eventCallbacks = new Map<string, EventCallback[]>();

    /**
     * Add event listener
     */
    on<K extends string>(event: K, callback: EventCallback<any>): void {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event)!.push(callback);
    }

    /**
     * Remove event listener
     */
    off<K extends string>(event: K, callback: EventCallback<any>): void {
        if (this.eventCallbacks.has(event)) {
            const callbacks = this.eventCallbacks.get(event)!;
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Add one-time event listener
     */
    once<K extends string>(event: K, callback: EventCallback<any>): void {
        const onceWrapper = (data: any) => {
            callback(data);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    }

    /**
     * Remove all event listeners for an event
     */
    removeAllListeners<K extends string>(event: K): void {
        this.eventCallbacks.delete(event);
    }

    /**
     * Remove all event listeners
     */
    removeAllEventListeners(): void {
        this.eventCallbacks.clear();
    }

    /**
     * Emit event to all listeners
     */
    emit<K extends string>(event: K, data: any = {}): void {
        if (this.eventCallbacks.has(event)) {
            const callbacks = this.eventCallbacks.get(event)!;

            // Create a copy of callbacks to avoid issues if listeners are modified during emission
            const callbacksCopy = [...callbacks];

            callbacksCopy.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event callback for '${event}':`, error);
                }
            });
        }
    }

    /**
     * Emit event synchronously (without error handling)
     */
    emitSync<K extends string>(event: K, data: any = {}): void {
        if (this.eventCallbacks.has(event)) {
            const callbacks = this.eventCallbacks.get(event)!;
            callbacks.forEach(callback => callback(data));
        }
    }

    /**
     * Get list of registered events
     */
    getRegisteredEvents(): string[] {
        return Array.from(this.eventCallbacks.keys());
    }

    /**
     * Get number of listeners for an event
     */
    listenerCount(event: string): number {
        return this.eventCallbacks.get(event)?.length || 0;
    }

    /**
     * Get all listeners for an event
     */
    listeners(event: string): EventCallback[] {
        return [...(this.eventCallbacks.get(event) || [])];
    }

    /**
     * Check if event has any listeners
     */
    hasListeners(event: string): boolean {
        return this.listenerCount(event) > 0;
    }

    /**
     * Get total number of event listeners across all events
     */
    getTotalListenerCount(): number {
        let total = 0;
        this.eventCallbacks.forEach(callbacks => {
            total += callbacks.length;
        });
        return total;
    }

    /**
     * Get event statistics
     */
    getEventStats(): {
        totalEvents: number;
        totalListeners: number;
        eventCounts: Map<string, number>;
    } {
        const eventCounts = new Map<string, number>();

        this.eventCallbacks.forEach((callbacks, event) => {
            eventCounts.set(event, callbacks.length);
        });

        return {
            totalEvents: this.eventCallbacks.size,
            totalListeners: this.getTotalListenerCount(),
            eventCounts
        };
    }

    /**
     * Create a prefixed event emitter that automatically prefixes all events
     */
    createNamespaced(namespace: string): InteractionEventEmitter<T> {
        const namespacedEmitter = new InteractionEventEmitter<T>();

        // Override the emit method to prefix events
        namespacedEmitter.emit = <K extends string>(event: K, data: any = {}) => {
            return this.emit(`${namespace}:${event}` as K, data);
        };

        // Override the on method to prefix events
        namespacedEmitter.on = <K extends string>(event: K, callback: EventCallback<any>) => {
            return this.on(`${namespace}:${event}` as K, callback);
        };

        // Override the off method to prefix events
        namespacedEmitter.off = <K extends string>(event: K, callback: EventCallback<any>) => {
            return this.off(`${namespace}:${event}` as K, callback);
        };

        return namespacedEmitter;
    }

    /**
     * Create event emitter with middleware support
     */
    withMiddleware(
        middleware: (event: string, data: any, next: () => void) => void
    ): InteractionEventEmitter<T> {
        const emitterWithMiddleware = new InteractionEventEmitter<T>();

        // Copy all existing listeners
        this.eventCallbacks.forEach((callbacks, event) => {
            callbacks.forEach(callback => {
                emitterWithMiddleware.on(event, callback);
            });
        });

        // Override emit to use middleware
        const originalEmit = emitterWithMiddleware.emit.bind(emitterWithMiddleware);
        emitterWithMiddleware.emit = <K extends string>(event: K, data: any = {}) => {
            middleware(event, data, () => {
                originalEmit(event, data);
            });
        };

        return emitterWithMiddleware;
    }

    /**
     * Create a filtered event emitter that only emits events matching a predicate
     */
    filtered(predicate: (event: string, data: any) => boolean): InteractionEventEmitter<T> {
        const filteredEmitter = new InteractionEventEmitter<T>();

        // Copy all existing listeners
        this.eventCallbacks.forEach((callbacks, event) => {
            callbacks.forEach(callback => {
                filteredEmitter.on(event, callback);
            });
        });

        // Override emit to apply filter
        const originalEmit = filteredEmitter.emit.bind(filteredEmitter);
        filteredEmitter.emit = <K extends string>(event: K, data: any = {}) => {
            if (predicate(event, data)) {
                originalEmit(event, data);
            }
        };

        return filteredEmitter;
    }

    /**
     * Clone this event emitter
     */
    clone(): InteractionEventEmitter<T> {
        const cloned = new InteractionEventEmitter<T>();

        // Copy all listeners
        this.eventCallbacks.forEach((callbacks, event) => {
            callbacks.forEach(callback => {
                cloned.on(event, callback);
            });
        });

        return cloned;
    }

    /**
     * Clean up all resources
     */
    destroy(): void {
        this.eventCallbacks.clear();
    }
}
