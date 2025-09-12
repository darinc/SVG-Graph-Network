import '@testing-library/jest-dom';

// Global test setup

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn((id: number) => clearTimeout(id));

// Mock console methods to reduce noise during tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Setup DOM environment
Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
        getPropertyValue: () => ''
    })
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
    x: 0,
    y: 0,
    toJSON: () => ({})
}));

// Mock SVG getBBox method
SVGElement.prototype.getBBox = jest.fn(() => ({
    x: 0,
    y: 0,
    width: 50,
    height: 20
}));

// Mock HTMLCanvasElement getContext method
HTMLCanvasElement.prototype.getContext = jest.fn((contextType: string) => {
    if (contextType === '2d') {
        return {
            font: '',
            measureText: jest.fn((text: string) => ({
                width: text.length * 8, // rough estimate
                height: 14
            })),
            fillText: jest.fn(),
            clearRect: jest.fn(),
            strokeText: jest.fn(),
            canvas: {
                width: 0,
                height: 0
            }
        };
    }
    return null;
});

// Custom matcher types
declare global {
    namespace jest {
        interface Matchers<R> {
            toBePositioned(x: number, y: number): R;
            toHaveClass(className: string): R;
        }
    }
}

// Setup custom matchers for SVG testing
expect.extend({
    toBePositioned(received: Element, x: number, y: number) {
        const transform = received.getAttribute('transform');
        const translateMatch = transform && transform.match(/translate\(([^,]+),([^)]+)\)/);
        
        if (!translateMatch) {
            return {
                message: () => `Expected element to have translate transform`,
                pass: false
            };
        }
        
        const [, actualX, actualY] = translateMatch;
        const pass = Math.abs(parseFloat(actualX) - x) < 0.01 && 
                    Math.abs(parseFloat(actualY) - y) < 0.01;
        
        return {
            message: () => pass 
                ? `Expected element not to be positioned at (${x}, ${y})`
                : `Expected element to be positioned at (${x}, ${y}) but was at (${actualX}, ${actualY})`,
            pass
        };
    },
    
    toHaveClass(received: Element, className: string) {
        const pass = received.classList.contains(className);
        return {
            message: () => pass 
                ? `Expected element not to have class "${className}"`
                : `Expected element to have class "${className}"`,
            pass
        };
    }
});