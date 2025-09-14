/**
 * Simple Dependency Injection Container
 *
 * Provides basic dependency injection functionality to reduce coupling
 * between components and enable easier testing.
 */

import 'reflect-metadata';

import {
    IDependencyContainer,
    Token,
    BindingBuilder,
    ServiceDescriptor,
    ServiceLifecycle
} from './interfaces';

export class DependencyContainer implements IDependencyContainer {
    private services = new Map<string, ServiceDescriptor>();
    private instances = new Map<string, any>();

    // ==================== BASIC REGISTRATION ====================

    register<T>(key: string, factory: () => T): void {
        this.services.set(key, {
            token: new Token<T>(key),
            factory,
            lifecycle: 'transient'
        });
    }

    registerSingleton<T>(key: string, factory: () => T): void {
        this.services.set(key, {
            token: new Token<T>(key),
            factory,
            lifecycle: 'singleton'
        });
    }

    registerInstance<T>(key: string, instance: T): void {
        this.services.set(key, {
            token: new Token<T>(key),
            factory: () => instance,
            lifecycle: 'singleton',
            instance
        });

        this.instances.set(key, instance);
    }

    resolve<T>(key: string): T {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`Service '${key}' is not registered`);
        }

        return this.getInstance(service);
    }

    has(key: string): boolean {
        return this.services.has(key);
    }

    clear(): void {
        this.services.clear();
        this.instances.clear();
    }

    // ==================== TYPE-SAFE REGISTRATION ====================

    bind<T>(token: Token<T>): BindingBuilder<T> {
        return new BindingBuilderImpl<T>(token, this);
    }

    get<T>(token: Token<T>): T {
        return this.resolve<T>(token.name);
    }

    // ==================== PRIVATE METHODS ====================

    private getInstance<T>(service: ServiceDescriptor<T>): T {
        const key = service.token.name;

        switch (service.lifecycle) {
            case 'singleton':
                if (!this.instances.has(key)) {
                    const instance = service.factory();
                    this.instances.set(key, instance);
                    return instance;
                }
                return this.instances.get(key);

            case 'transient':
                return service.factory();

            case 'scoped':
                // For now, treat scoped like singleton
                // In a full implementation, scoped would be per-request or per-operation
                if (!this.instances.has(key)) {
                    const instance = service.factory();
                    this.instances.set(key, instance);
                    return instance;
                }
                return this.instances.get(key);

            default:
                throw new Error(`Unsupported lifecycle: ${service.lifecycle}`);
        }
    }

    // ==================== UTILITY METHODS ====================

    getRegisteredServices(): string[] {
        return Array.from(this.services.keys());
    }

    getServiceInfo(key: string): {
        lifecycle: ServiceLifecycle;
        hasInstance: boolean;
    } | null {
        const service = this.services.get(key);
        if (!service) {
            return null;
        }

        return {
            lifecycle: service.lifecycle,
            hasInstance: this.instances.has(key)
        };
    }

    dispose(): void {
        // Dispose of instances that implement dispose method
        for (const [key, instance] of this.instances.entries()) {
            if (instance && typeof instance.dispose === 'function') {
                try {
                    instance.dispose();
                } catch (error) {
                    console.error(`Error disposing service '${key}':`, error);
                }
            }
        }

        this.clear();
    }
}

class BindingBuilderImpl<T> implements BindingBuilder<T> {
    constructor(
        private token: Token<T>,
        private container: DependencyContainer
    ) {}

    to(factory: () => T): void {
        this.container.register(this.token.name, factory);
    }

    toSingleton(factory: () => T): void {
        this.container.registerSingleton(this.token.name, factory);
    }

    toInstance(instance: T): void {
        this.container.registerInstance(this.token.name, instance);
    }
}

// ==================== PREDEFINED TOKENS ====================

export const SERVICE_TOKENS = {
    DATA_MANAGER: new Token<any>('IGraphDataManager'),
    ANIMATION_CONTROLLER: new Token<any>('IGraphAnimationController'),
    RENDERER: new Token<any>('IRenderer'),
    UI_MANAGER: new Token<any>('IUIManager'),
    EVENT_MANAGER: new Token<any>('IEventManager'),
    THEME_MANAGER: new Token<any>('IThemeManager'),
    PHYSICS_ENGINE: new Token<any>('IPhysicsEngine'),
    EVENT_BUS: new Token<any>('IEventBus'),
    LOGGER: new Token<any>('ILogger'),
    PERFORMANCE_MONITOR: new Token<any>('IPerformanceMonitor')
};

// ==================== CONTAINER FACTORY ====================

export class ContainerBuilder {
    private container = new DependencyContainer();

    static create(): ContainerBuilder {
        return new ContainerBuilder();
    }

    register<T>(key: string, factory: () => T): this {
        this.container.register(key, factory);
        return this;
    }

    registerSingleton<T>(key: string, factory: () => T): this {
        this.container.registerSingleton(key, factory);
        return this;
    }

    registerInstance<T>(key: string, instance: T): this {
        this.container.registerInstance(key, instance);
        return this;
    }

    bind<T>(token: Token<T>): BindingBuilder<T> {
        return this.container.bind(token);
    }

    build(): IDependencyContainer {
        return this.container;
    }
}

// ==================== HELPER DECORATORS ====================

/**
 * Simple injectable decorator for classes
 * Usage: @injectable() class MyService { ... }
 */
export function injectable<T extends new (...args: unknown[]) => unknown>(constructor: T) {
    // Store metadata about the injectable class
    (constructor as any).__injectable = true;
    return constructor;
}

/**
 * Simple inject decorator for constructor parameters
 * Usage: constructor(@inject('ServiceToken') private service: IService) { ... }
 */
export function inject(token: string | Token<any>) {
    return function (
        target: any,
        _propertyKey: string | symbol | undefined,
        parameterIndex: number
    ) {
        const tokenName = typeof token === 'string' ? token : token.name;

        // Store injection metadata
        const existingTokens = Reflect.getMetadata('inject:tokens', target) || [];
        existingTokens[parameterIndex] = tokenName;
        Reflect.defineMetadata('inject:tokens', existingTokens, target);
    };
}

// ==================== AUTO-WIRING SUPPORT ====================

export class AutoWiringContainer extends DependencyContainer {
    /**
     * Automatically creates an instance of a class by resolving its dependencies
     */
    create<T>(constructor: new (...args: unknown[]) => T): T {
        if (!(constructor as any).__injectable) {
            throw new Error(`Class ${constructor.name} is not marked as @injectable`);
        }

        const tokens = Reflect.getMetadata('inject:tokens', constructor) || [];
        const args: any[] = [];

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i]) {
                args[i] = this.resolve(tokens[i]);
            }
        }

        return new constructor(...args);
    }

    /**
     * Register a class with automatic dependency resolution
     */
    registerClass<T>(
        key: string,
        constructor: new (...args: unknown[]) => T,
        lifecycle: ServiceLifecycle = 'transient'
    ): void {
        const factory = () => this.create(constructor);

        switch (lifecycle) {
            case 'singleton':
                this.registerSingleton(key, factory);
                break;
            case 'transient':
                this.register(key, factory);
                break;
            case 'scoped':
                // For now, treat as singleton
                this.registerSingleton(key, factory);
                break;
        }
    }
}

// Note: For full decorator support, you would need to install reflect-metadata
// and configure TypeScript with "experimentalDecorators": true
// For this implementation, we'll keep it simple without requiring additional dependencies
