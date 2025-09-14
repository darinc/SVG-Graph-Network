/**
 * GraphAnimationController - Manages animation loop and timing
 *
 * Extracted from GraphNetwork to follow Single Responsibility Principle.
 * This class is responsible for:
 * - Managing animation frame loop
 * - Controlling animation state (start/stop)
 * - Coordinating physics updates with rendering
 * - Performance monitoring and frame timing
 */

export interface AnimationMetrics {
    fps: number;
    frameTime: number;
    droppedFrames: number;
    totalFrames: number;
    averageFrameTime: number;
    isRunning: boolean;
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

export class GraphAnimationController implements IGraphAnimationController {
    private animationId: number | null = null;
    private isActive = false;
    private paused = false;
    private lastFrameTime = 0;
    private frameCallbacks: Array<(deltaTime: number) => void> = [];
    private targetFPS = 60;
    private frameInterval: number;

    // Performance metrics
    private frameCount = 0;
    private droppedFrameCount = 0;
    private frameTimes: number[] = [];
    private lastFPSCalculation = 0;
    private currentFPS = 0;
    private readonly maxFrameTimeHistory = 100;

    constructor(targetFPS: number = 60) {
        this.targetFPS = targetFPS;
        this.frameInterval = 1000 / targetFPS;
        this.lastFrameTime = performance.now();
    }

    // ==================== ANIMATION CONTROL ====================

    start(): void {
        if (this.isActive) {
            return;
        }

        this.isActive = true;
        this.paused = false;
        this.lastFrameTime = performance.now();
        this.lastFPSCalculation = this.lastFrameTime;
        this.frameCount = 0;
        this.droppedFrameCount = 0;
        this.frameTimes.length = 0;

        this.scheduleNextFrame();
    }

    stop(): void {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;
        this.paused = false;

        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    pause(): void {
        if (!this.isActive || this.paused) {
            return;
        }

        this.paused = true;

        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resume(): void {
        if (!this.isActive || !this.paused) {
            return;
        }

        this.paused = false;
        this.lastFrameTime = performance.now();
        this.scheduleNextFrame();
    }

    isRunning(): boolean {
        return this.isActive && !this.paused;
    }

    isPaused(): boolean {
        return this.paused;
    }

    // ==================== FRAME MANAGEMENT ====================

    private scheduleNextFrame(): void {
        if (!this.isActive || this.paused) {
            return;
        }

        this.animationId = requestAnimationFrame(currentTime => {
            this.processFrame(currentTime);
        });
    }

    private processFrame(currentTime: number): void {
        if (!this.isActive || this.paused) {
            return;
        }

        const deltaTime = currentTime - this.lastFrameTime;

        // Frame rate limiting
        if (deltaTime < this.frameInterval) {
            this.scheduleNextFrame();
            return;
        }

        // Update metrics
        this.updateMetrics(currentTime, deltaTime);

        // Execute frame callbacks
        try {
            for (const callback of this.frameCallbacks) {
                callback(deltaTime);
            }
        } catch (error) {
            console.error('Error in animation frame callback:', error);
        }

        this.lastFrameTime = currentTime;
        this.scheduleNextFrame();
    }

    private updateMetrics(currentTime: number, deltaTime: number): void {
        this.frameCount++;

        // Track frame times for average calculation
        this.frameTimes.push(deltaTime);
        if (this.frameTimes.length > this.maxFrameTimeHistory) {
            this.frameTimes.shift();
        }

        // Detect dropped frames (frame took significantly longer than target)
        if (deltaTime > this.frameInterval * 1.5) {
            this.droppedFrameCount++;
        }

        // Calculate FPS every second
        if (currentTime - this.lastFPSCalculation >= 1000) {
            const actualFrameInterval = (currentTime - this.lastFPSCalculation) / this.frameCount;
            this.currentFPS = 1000 / actualFrameInterval;

            this.lastFPSCalculation = currentTime;
            this.frameCount = 0;
        }
    }

    // ==================== CALLBACK MANAGEMENT ====================

    onFrame(callback: (deltaTime: number) => void): void {
        if (!this.frameCallbacks.includes(callback)) {
            this.frameCallbacks.push(callback);
        }
    }

    removeFrameCallback(callback: (deltaTime: number) => void): void {
        const index = this.frameCallbacks.indexOf(callback);
        if (index !== -1) {
            this.frameCallbacks.splice(index, 1);
        }
    }

    clearFrameCallbacks(): void {
        this.frameCallbacks.length = 0;
    }

    // ==================== CONFIGURATION ====================

    setTargetFPS(fps: number): void {
        if (fps <= 0 || fps > 240) {
            throw new Error('Target FPS must be between 1 and 240');
        }

        this.targetFPS = fps;
        this.frameInterval = 1000 / fps;
    }

    getTargetFPS(): number {
        return this.targetFPS;
    }

    // ==================== METRICS ====================

    getMetrics(): AnimationMetrics {
        const averageFrameTime =
            this.frameTimes.length > 0
                ? this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length
                : 0;

        return {
            fps: this.currentFPS,
            frameTime: this.frameTimes.length > 0 ? this.frameTimes[this.frameTimes.length - 1] : 0,
            droppedFrames: this.droppedFrameCount,
            totalFrames: this.frameCount,
            averageFrameTime,
            isRunning: this.isRunning()
        };
    }

    resetMetrics(): void {
        this.frameCount = 0;
        this.droppedFrameCount = 0;
        this.frameTimes.length = 0;
        this.currentFPS = 0;
        this.lastFPSCalculation = performance.now();
    }

    // ==================== PERFORMANCE MONITORING ====================

    getPerformanceReport(): {
        averageFPS: number;
        minFrameTime: number;
        maxFrameTime: number;
        frameTimeStdDev: number;
        droppedFramePercentage: number;
        isPerformanceGood: boolean;
    } {
        if (this.frameTimes.length === 0) {
            return {
                averageFPS: 0,
                minFrameTime: 0,
                maxFrameTime: 0,
                frameTimeStdDev: 0,
                droppedFramePercentage: 0,
                isPerformanceGood: false
            };
        }

        const minFrameTime = Math.min(...this.frameTimes);
        const maxFrameTime = Math.max(...this.frameTimes);
        const averageFrameTime =
            this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
        const averageFPS = 1000 / averageFrameTime;

        // Calculate standard deviation
        const variance =
            this.frameTimes.reduce((sum, time) => {
                const diff = time - averageFrameTime;
                return sum + diff * diff;
            }, 0) / this.frameTimes.length;
        const frameTimeStdDev = Math.sqrt(variance);

        const totalFrames = this.frameCount + this.droppedFrameCount;
        const droppedFramePercentage =
            totalFrames > 0 ? (this.droppedFrameCount / totalFrames) * 100 : 0;

        // Performance is considered good if:
        // - Average FPS is within 10% of target
        // - Less than 5% dropped frames
        // - Frame time variation is reasonable (std dev < 5ms)
        const isPerformanceGood =
            averageFPS >= this.targetFPS * 0.9 && droppedFramePercentage < 5 && frameTimeStdDev < 5;

        return {
            averageFPS,
            minFrameTime,
            maxFrameTime,
            frameTimeStdDev,
            droppedFramePercentage,
            isPerformanceGood
        };
    }

    // ==================== ADAPTIVE PERFORMANCE ====================

    /**
     * Automatically adjusts target FPS based on performance
     * This can help maintain smooth animation on slower devices
     */
    enableAdaptivePerformance(
        options: {
            minFPS?: number;
            maxFPS?: number;
            adjustmentThreshold?: number;
            adjustmentFactor?: number;
        } = {}
    ): void {
        const {
            minFPS = 30,
            maxFPS = 60,
            adjustmentThreshold = 0.8, // Adjust if FPS drops below 80% of target
            adjustmentFactor = 0.9 // Reduce target by 10% when adjusting
        } = options;

        const performanceCallback = () => {
            const metrics = this.getMetrics();

            if (metrics.fps < this.targetFPS * adjustmentThreshold) {
                // Performance is poor, reduce target FPS
                const newTargetFPS = Math.max(
                    minFPS,
                    Math.floor(this.targetFPS * adjustmentFactor)
                );
                if (newTargetFPS !== this.targetFPS) {
                    this.setTargetFPS(newTargetFPS);
                    console.log(`Adaptive performance: Reduced target FPS to ${newTargetFPS}`);
                }
            } else if (metrics.fps > this.targetFPS * 1.1 && this.targetFPS < maxFPS) {
                // Performance is good, try increasing target FPS
                const newTargetFPS = Math.min(maxFPS, this.targetFPS + 5);
                if (newTargetFPS !== this.targetFPS) {
                    this.setTargetFPS(newTargetFPS);
                    console.log(`Adaptive performance: Increased target FPS to ${newTargetFPS}`);
                }
            }
        };

        // Check performance every 5 seconds
        setInterval(performanceCallback, 5000);
    }

    // ==================== CLEANUP ====================

    destroy(): void {
        this.stop();
        this.clearFrameCallbacks();
        this.frameTimes.length = 0;
    }
}
