import { devAssert } from '../../../src/utils/devAssert';

describe('devAssert', () => {
    test('should not throw when condition is true', () => {
        expect(() => devAssert(true, 'should not throw')).not.toThrow();
    });

    test('should throw when condition is false in dev mode', () => {
        expect(() => devAssert(false, 'test failure')).toThrow(
            '[svgnet] Assertion failed: test failure'
        );
    });

    test('should include the message in the error', () => {
        expect(() => devAssert(false, 'specific error message')).toThrow('specific error message');
    });

    test('should narrow types via asserts condition', () => {
        const value: string | null = 'hello';
        devAssert(value !== null, 'value is null');
        // After devAssert, TypeScript should know value is string
        expect(value).toHaveLength(5);
    });
});
