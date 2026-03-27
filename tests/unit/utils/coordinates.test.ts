import { screenToGraph, screenToContainer } from '../../../src/interaction/utils/coordinates';

describe('coordinates', () => {
    const mockRect = {
        left: 100,
        top: 50,
        width: 800,
        height: 600,
        right: 900,
        bottom: 650,
        x: 100,
        y: 50,
        toJSON: () => ({})
    } as DOMRect;

    describe('screenToGraph', () => {
        test('should convert screen coordinates to graph space at scale 1', () => {
            const result = screenToGraph(300, 250, mockRect, { x: 0, y: 0, scale: 1 });
            expect(result.x).toBe(200); // 300 - 100 (rect.left)
            expect(result.y).toBe(200); // 250 - 50 (rect.top)
        });

        test('should account for transform translation', () => {
            const result = screenToGraph(300, 250, mockRect, { x: 50, y: 25, scale: 1 });
            expect(result.x).toBe(150); // (300 - 100 - 50) / 1
            expect(result.y).toBe(175); // (250 - 50 - 25) / 1
        });

        test('should account for scale', () => {
            const result = screenToGraph(300, 250, mockRect, { x: 0, y: 0, scale: 2 });
            expect(result.x).toBe(100); // (300 - 100) / 2
            expect(result.y).toBe(100); // (250 - 50) / 2
        });

        test('should handle combined translation and scale', () => {
            const result = screenToGraph(400, 350, mockRect, { x: 100, y: 50, scale: 2 });
            expect(result.x).toBe(100); // (400 - 100 - 100) / 2
            expect(result.y).toBe(125); // (350 - 50 - 50) / 2
        });
    });

    describe('screenToContainer', () => {
        test('should convert screen coordinates to container-relative', () => {
            const result = screenToContainer(300, 250, mockRect);
            expect(result.x).toBe(200); // 300 - 100
            expect(result.y).toBe(200); // 250 - 50
        });

        test('should handle coordinates at container origin', () => {
            const result = screenToContainer(100, 50, mockRect);
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
        });
    });
});
