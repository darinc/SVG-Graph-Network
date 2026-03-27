import { AutoColorGenerator } from '../../../src/theming/AutoColorGenerator';

describe('AutoColorGenerator', () => {
    let generator: AutoColorGenerator;

    beforeEach(() => {
        generator = new AutoColorGenerator();
    });

    test('should generate a style config for a type', () => {
        const style = generator.generateColorForType('server', 'dark');
        expect(style).toBeDefined();
        expect(style.fill).toBeDefined();
        expect(typeof style.fill).toBe('string');
    });

    test('should return consistent colors for the same type', () => {
        const style1 = generator.generateColorForType('database', 'dark');
        const style2 = generator.generateColorForType('database', 'dark');
        expect(style1.fill).toBe(style2.fill);
    });

    test('should generate different colors for different types', () => {
        const style1 = generator.generateColorForType('server', 'dark');
        const style2 = generator.generateColorForType('database', 'dark');
        const style3 = generator.generateColorForType('cache', 'dark');
        const unique = new Set([style1.fill, style2.fill, style3.fill]);
        expect(unique.size).toBeGreaterThan(1);
    });

    test('should handle empty string type', () => {
        const style = generator.generateColorForType('', 'dark');
        expect(style).toBeDefined();
        expect(style.fill).toBeDefined();
    });

    test('should handle different themes', () => {
        const darkStyle = generator.generateColorForType('server', 'dark');
        const lightStyle = generator.generateColorForType('server', 'light');
        // Both should return valid styles
        expect(darkStyle.fill).toBeDefined();
        expect(lightStyle.fill).toBeDefined();
    });
});
