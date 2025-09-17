export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

interface LoggerOptions {
    module?: string;
    level?: LogLevel;
    enableTimestamp?: boolean;
    enabled?: boolean;
}

class Logger {
    private static globalLevel: LogLevel = LogLevel.INFO;
    private static globalEnabled: boolean = true;

    private module: string;
    private level: LogLevel;
    private enableTimestamp: boolean;
    private enabled: boolean;

    constructor(options: LoggerOptions = {}) {
        this.module = options.module || 'App';
        this.level = options.level ?? Logger.globalLevel;
        this.enableTimestamp = options.enableTimestamp ?? false;
        this.enabled = options.enabled ?? Logger.globalEnabled;
    }

    static setGlobalLevel(level: LogLevel): void {
        Logger.globalLevel = level;
    }

    static setGlobalEnabled(enabled: boolean): void {
        Logger.globalEnabled = enabled;
    }

    static getGlobalLevel(): LogLevel {
        return Logger.globalLevel;
    }

    private shouldLog(level: LogLevel): boolean {
        return this.enabled && Logger.globalEnabled && level <= this.level;
    }

    private formatMessage(level: string, message: string, ...args: unknown[]): unknown[] {
        const timestamp = this.enableTimestamp ? `[${new Date().toISOString()}] ` : '';
        const prefix = `${timestamp}[${this.module}] ${level}:`;
        return [prefix, message, ...args];
    }

    error(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            // eslint-disable-next-line no-console
            console.error(...this.formatMessage('ERROR', message, ...args));
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.WARN)) {
            // eslint-disable-next-line no-console
            console.warn(...this.formatMessage('WARN', message, ...args));
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.INFO)) {
            // eslint-disable-next-line no-console
            console.info(...this.formatMessage('INFO', message, ...args));
        }
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            // eslint-disable-next-line no-console
            console.log(...this.formatMessage('DEBUG', message, ...args));
        }
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    getLevel(): LogLevel {
        return this.level;
    }

    isEnabled(): boolean {
        return this.enabled;
    }
}

// Factory function for creating module-specific loggers
export function createLogger(module: string, options: Omit<LoggerOptions, 'module'> = {}): Logger {
    return new Logger({ ...options, module });
}

// Export the Logger class for direct instantiation if needed
export { Logger };

// Export utility functions for quick access
export const logger = new Logger({ module: 'App' });
