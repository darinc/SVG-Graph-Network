/**
 * EventBus Tests
 * 
 * Tests the event system that provides decoupled inter-module communication
 * for the decomposed GraphNetwork architecture.
 */

import { EventBus, EventHandler, EventBusConfig } from '../../../src/events/EventBus';

describe('EventBus', () => {
    let eventBus: EventBus;
    let mockHandler: jest.MockedFunction<EventHandler>;
    let mockHandler2: jest.MockedFunction<EventHandler>;

    beforeEach(() => {
        eventBus = new EventBus();
        mockHandler = jest.fn();
        mockHandler2 = jest.fn();
    });

    afterEach(() => {
        eventBus.destroy();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should create EventBus with default config', () => {
            expect(eventBus).toBeDefined();
            expect(eventBus.getTotalListeners()).toBe(0);
            expect(eventBus.getEventTypes()).toEqual([]);
        });

        test('should create EventBus with custom config', () => {
            const config: EventBusConfig = {
                enableLogging: true,
                maxListeners: 50,
                enableMetrics: false
            };
            
            const customBus = new EventBus(config);
            expect(customBus).toBeDefined();
            customBus.destroy();
        });

        test('should create EventBus using factory method', () => {
            const factoryBus = EventBus.create({ enableLogging: true });
            expect(factoryBus).toBeDefined();
            factoryBus.destroy();
        });
    });

    describe('Event Subscription', () => {
        test('should subscribe to events', () => {
            const subscription = eventBus.on('test-event', mockHandler);
            
            expect(eventBus.getTotalListeners()).toBe(1);
            expect(eventBus.getListenerCount('test-event')).toBe(1);
            expect(eventBus.hasListeners('test-event')).toBeTruthy();
            expect(subscription.unsubscribe).toBeDefined();
        });

        test('should support multiple subscribers to same event', () => {
            eventBus.on('test-event', mockHandler);
            eventBus.on('test-event', mockHandler2);
            
            expect(eventBus.getListenerCount('test-event')).toBe(2);
            expect(eventBus.getTotalListeners()).toBe(2);
        });

        test('should support different event types', () => {
            eventBus.on('event-1', mockHandler);
            eventBus.on('event-2', mockHandler2);
            
            expect(eventBus.getEventTypes()).toContain('event-1');
            expect(eventBus.getEventTypes()).toContain('event-2');
            expect(eventBus.getTotalListeners()).toBe(2);
        });

        test('should unsubscribe from events', () => {
            const subscription = eventBus.on('test-event', mockHandler);
            expect(eventBus.getTotalListeners()).toBe(1);
            
            subscription.unsubscribe();
            
            expect(eventBus.getTotalListeners()).toBe(0);
            expect(eventBus.hasListeners('test-event')).toBeFalsy();
        });

        test('should handle multiple unsubscribes gracefully', () => {
            const subscription = eventBus.on('test-event', mockHandler);
            
            subscription.unsubscribe();
            subscription.unsubscribe(); // Should not throw
            
            expect(eventBus.getTotalListeners()).toBe(0);
        });
    });

    describe('Once Subscriptions', () => {
        test('should subscribe to events for one occurrence only', () => {
            eventBus.once('once-event', mockHandler);
            
            expect(eventBus.getTotalListeners()).toBe(1);
            expect(eventBus.hasListeners('once-event')).toBeTruthy();
        });

        test('should remove once listeners after emission', async () => {
            eventBus.once('once-event', mockHandler);
            
            await eventBus.emit('once-event', 'test-data');
            
            expect(mockHandler).toHaveBeenCalledWith('test-data');
            expect(eventBus.getTotalListeners()).toBe(0);
            expect(eventBus.hasListeners('once-event')).toBeFalsy();
        });

        test('should support both once and persistent listeners', async () => {
            eventBus.on('mixed-event', mockHandler);
            eventBus.once('mixed-event', mockHandler2);
            
            expect(eventBus.getListenerCount('mixed-event')).toBe(2);
            
            await eventBus.emit('mixed-event', 'data');
            
            expect(mockHandler).toHaveBeenCalledWith('data');
            expect(mockHandler2).toHaveBeenCalledWith('data');
            expect(eventBus.getListenerCount('mixed-event')).toBe(1); // Only persistent remains
        });
    });

    describe('Event Emission', () => {
        test('should emit events to subscribers', async () => {
            eventBus.on('test-event', mockHandler);
            
            await eventBus.emit('test-event', 'test-data');
            
            expect(mockHandler).toHaveBeenCalledWith('test-data');
        });

        test('should emit events to multiple subscribers', async () => {
            eventBus.on('test-event', mockHandler);
            eventBus.on('test-event', mockHandler2);
            
            await eventBus.emit('test-event', 'shared-data');
            
            expect(mockHandler).toHaveBeenCalledWith('shared-data');
            expect(mockHandler2).toHaveBeenCalledWith('shared-data');
        });

        test('should handle events with no subscribers', async () => {
            await expect(eventBus.emit('no-listeners', 'data')).resolves.not.toThrow();
        });

        test('should support different data types', async () => {
            const objectData = { key: 'value', number: 42 };
            const arrayData = [1, 2, 3];
            
            eventBus.on('object-event', mockHandler);
            eventBus.on('array-event', mockHandler2);
            
            await eventBus.emit('object-event', objectData);
            await eventBus.emit('array-event', arrayData);
            
            expect(mockHandler).toHaveBeenCalledWith(objectData);
            expect(mockHandler2).toHaveBeenCalledWith(arrayData);
        });

        test('should handle async event handlers', async () => {
            const asyncHandler = jest.fn().mockImplementation(async (data) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return data;
            });
            
            eventBus.on('async-event', asyncHandler);
            
            await eventBus.emit('async-event', 'async-data');
            
            expect(asyncHandler).toHaveBeenCalledWith('async-data');
        });
    });

    describe('Synchronous Emission', () => {
        test('should emit events synchronously', () => {
            eventBus.on('sync-event', mockHandler);
            
            eventBus.emitSync('sync-event', 'sync-data');
            
            expect(mockHandler).toHaveBeenCalledWith('sync-data');
        });

        test('should warn about async handlers in sync emission', () => {
            const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            const asyncHandler = jest.fn().mockReturnValue(Promise.resolve());
            
            eventBus.on('sync-event', asyncHandler);
            eventBus.emitSync('sync-event', 'data');
            
            expect(consoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Async handler called with emitSync')
            );
            
            consoleWarn.mockRestore();
        });

        test('should handle once listeners in sync emission', () => {
            eventBus.once('sync-once', mockHandler);
            
            eventBus.emitSync('sync-once', 'data');
            
            expect(mockHandler).toHaveBeenCalledWith('data');
            expect(eventBus.hasListeners('sync-once')).toBeFalsy();
        });
    });

    describe('Error Handling', () => {
        test('should handle errors in event handlers', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation();
            const errorHandler = jest.fn().mockImplementation(() => {
                throw new Error('Handler error');
            });
            
            eventBus.on('error-event', errorHandler);
            eventBus.on('error-event', mockHandler); // This should still execute
            
            await eventBus.emit('error-event', 'data');
            
            expect(errorHandler).toHaveBeenCalled();
            expect(mockHandler).toHaveBeenCalledWith('data');
            expect(consoleError).toHaveBeenCalledWith(
                expect.stringContaining('Error in handler'),
                expect.any(Error)
            );
            
            const metrics = eventBus.getMetrics();
            expect(metrics.errorCount).toBe(1);
            
            consoleError.mockRestore();
        });

        test('should handle async errors in event handlers', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation();
            const asyncErrorHandler = jest.fn().mockImplementation(async () => {
                throw new Error('Async handler error');
            });
            
            eventBus.on('async-error-event', asyncErrorHandler);
            
            await eventBus.emit('async-error-event', 'data');
            
            expect(asyncErrorHandler).toHaveBeenCalled();
            expect(consoleError).toHaveBeenCalled();
            
            consoleError.mockRestore();
        });

        test('should handle errors in sync emission', () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation();
            const errorHandler = jest.fn().mockImplementation(() => {
                throw new Error('Sync handler error');
            });
            
            eventBus.on('sync-error', errorHandler);
            
            expect(() => {
                eventBus.emitSync('sync-error', 'data');
            }).not.toThrow();
            
            expect(consoleError).toHaveBeenCalled();
            
            consoleError.mockRestore();
        });
    });

    describe('Listener Management', () => {
        test('should remove all listeners for specific event type', () => {
            eventBus.on('remove-event', mockHandler);
            eventBus.on('remove-event', mockHandler2);
            eventBus.on('keep-event', mockHandler);
            
            expect(eventBus.getListenerCount('remove-event')).toBe(2);
            expect(eventBus.getTotalListeners()).toBe(3);
            
            eventBus.off('remove-event');
            
            expect(eventBus.getListenerCount('remove-event')).toBe(0);
            expect(eventBus.getListenerCount('keep-event')).toBe(1);
            expect(eventBus.getTotalListeners()).toBe(1);
        });

        test('should remove all listeners', () => {
            eventBus.on('event-1', mockHandler);
            eventBus.on('event-2', mockHandler2);
            eventBus.once('event-3', mockHandler);
            
            expect(eventBus.getTotalListeners()).toBe(3);
            
            eventBus.removeAllListeners();
            
            expect(eventBus.getTotalListeners()).toBe(0);
            expect(eventBus.getEventTypes()).toEqual([]);
        });

        test('should warn when max listeners exceeded', () => {
            const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            const limitedBus = new EventBus({ maxListeners: 2 });
            
            limitedBus.on('test', mockHandler);
            limitedBus.on('test', mockHandler2);
            limitedBus.on('test', jest.fn()); // Should trigger warning
            
            expect(consoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('Maximum listeners')
            );
            
            consoleWarn.mockRestore();
            limitedBus.destroy();
        });
    });

    describe('Metrics and Monitoring', () => {
        test('should track event metrics', async () => {
            eventBus.on('metric-event', mockHandler);
            
            await eventBus.emit('metric-event', 'data1');
            await eventBus.emit('metric-event', 'data2');
            await eventBus.emit('other-event', 'data3');
            
            const metrics = eventBus.getMetrics();
            
            expect(metrics.totalEvents).toBe(3);
            expect(metrics.eventsByType.get('metric-event')).toBe(2);
            expect(metrics.eventsByType.get('other-event')).toBe(1);
            expect(metrics.activeSubscriptions).toBe(1);
        });

        test('should track handler performance', async () => {
            const slowHandler = jest.fn().mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 20));
            });
            
            eventBus.on('slow-event', slowHandler);
            
            await eventBus.emit('slow-event', 'data');
            
            const metrics = eventBus.getMetrics();
            expect(metrics.averageHandlerTime).toBeGreaterThan(0);
        });

        test('should reset metrics', async () => {
            eventBus.on('test', mockHandler);
            await eventBus.emit('test', 'data');
            
            let metrics = eventBus.getMetrics();
            expect(metrics.totalEvents).toBe(1);
            
            eventBus.resetMetrics();
            
            metrics = eventBus.getMetrics();
            expect(metrics.totalEvents).toBe(0);
            expect(metrics.eventsByType.size).toBe(0);
            expect(metrics.averageHandlerTime).toBe(0);
        });

        test('should disable metrics when configured', () => {
            const noMetricsBus = new EventBus({ enableMetrics: false });
            // Should not throw and should handle metric tracking gracefully
            expect(() => {
                noMetricsBus.on('test', mockHandler);
                noMetricsBus.emitSync('test', 'data');
            }).not.toThrow();
            
            noMetricsBus.destroy();
        });
    });

    describe('Namespaced EventBus', () => {
        test('should create namespaced event bus', () => {
            const namespace = eventBus.createNamespace('physics');
            expect(namespace).toBeDefined();
        });

        test('should isolate events by namespace', async () => {
            const physicsNamespace = eventBus.createNamespace('physics');
            const renderingNamespace = eventBus.createNamespace('rendering');
            
            physicsNamespace.on('update', mockHandler);
            renderingNamespace.on('update', mockHandler2);
            
            await physicsNamespace.emit('update', 'physics-data');
            
            expect(mockHandler).toHaveBeenCalledWith('physics-data');
            expect(mockHandler2).not.toHaveBeenCalled();
        });

        test('should support namespaced once subscriptions', async () => {
            const namespace = eventBus.createNamespace('test');
            
            namespace.once('once-event', mockHandler);
            
            await namespace.emit('once-event', 'data');
            await namespace.emit('once-event', 'data2');
            
            expect(mockHandler).toHaveBeenCalledTimes(1);
            expect(mockHandler).toHaveBeenCalledWith('data');
        });

        test('should support namespaced listener management', () => {
            const namespace = eventBus.createNamespace('test');
            
            namespace.on('event', mockHandler);
            expect(namespace.hasListeners('event')).toBeTruthy();
            expect(namespace.getListenerCount('event')).toBe(1);
            
            namespace.off('event');
            expect(namespace.hasListeners('event')).toBeFalsy();
        });
    });

    describe('Performance Considerations', () => {
        test('should handle large number of listeners efficiently', async () => {
            const handlerCount = 1000;
            const handlers = Array.from({ length: handlerCount }, () => jest.fn());
            
            // Add many listeners
            handlers.forEach(handler => {
                eventBus.on('perf-test', handler);
            });
            
            expect(eventBus.getListenerCount('perf-test')).toBe(handlerCount);
            
            const startTime = performance.now();
            await eventBus.emit('perf-test', 'data');
            const endTime = performance.now();
            
            // Should complete within reasonable time
            expect(endTime - startTime).toBeLessThan(100);
            
            // All handlers should have been called
            handlers.forEach(handler => {
                expect(handler).toHaveBeenCalledWith('data');
            });
        });

        test('should handle rapid event emissions', async () => {
            eventBus.on('rapid-event', mockHandler);
            
            const promises = Array.from({ length: 100 }, (_, i) => 
                eventBus.emit('rapid-event', `data-${i}`)
            );
            
            await Promise.all(promises);
            
            expect(mockHandler).toHaveBeenCalledTimes(100);
        });
    });

    describe('Resource Management', () => {
        test('should clean up resources on destroy', () => {
            eventBus.on('test', mockHandler);
            eventBus.once('once-test', mockHandler2);
            
            expect(eventBus.getTotalListeners()).toBe(2);
            
            eventBus.destroy();
            
            expect(eventBus.getTotalListeners()).toBe(0);
            expect(eventBus.getEventTypes()).toEqual([]);
        });

        test('should handle multiple destroy calls gracefully', () => {
            expect(() => {
                eventBus.destroy();
                eventBus.destroy();
            }).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        test('should handle null/undefined event data', async () => {
            eventBus.on('null-event', mockHandler);
            eventBus.on('undefined-event', mockHandler2);
            
            await eventBus.emit('null-event', null);
            await eventBus.emit('undefined-event', undefined);
            
            expect(mockHandler).toHaveBeenCalledWith(null);
            expect(mockHandler2).toHaveBeenCalledWith(undefined);
        });

        test('should handle empty event type strings', () => {
            expect(() => {
                eventBus.on('', mockHandler);
                eventBus.emit('', 'data');
            }).not.toThrow();
        });

        test('should handle very long event type names', () => {
            const longEventType = 'a'.repeat(1000);
            
            expect(() => {
                eventBus.on(longEventType, mockHandler);
                eventBus.emitSync(longEventType, 'data');
            }).not.toThrow();
            
            expect(mockHandler).toHaveBeenCalledWith('data');
        });
    });
});