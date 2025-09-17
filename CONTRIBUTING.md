# Contributing to SVG Graph Network

Thank you for your interest in contributing to SVG Graph Network! This document provides guidelines and information to help you contribute effectively.

## Table of Contents

- [Development Setup](#development-setup)
- [Code Style and Standards](#code-style-and-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [API Development Guidelines](#api-development-guidelines)
- [Performance Considerations](#performance-considerations)
- [Documentation](#documentation)

## Development Setup

### Prerequisites

- Node.js 14.0.0 or higher
- npm 6.0.0 or higher
- Git

### Installation

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/darinc/svg-graph-network.git
   cd svg-graph-network
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:8080` to see the development version.

### Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production version
- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run docs` - Generate API documentation
- `npm run docs:serve` - Generate and serve documentation locally
- `npm run size` - Check bundle size

## Code Style and Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Enable strict mode (already configured)
- Provide proper type annotations for public APIs
- Use interfaces for object shapes
- Use enums for constant groups

### Code Formatting

We use Prettier and ESLint to maintain consistent code style:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### Pre-commit Hooks

The project uses Husky with lint-staged to run quality checks before commits:

- ESLint checks and auto-fixes
- Prettier formatting
- TypeScript compilation check
- Tests (if affected)

### Naming Conventions

- **Classes**: PascalCase (`GraphNetwork`, `PhysicsEngine`)
- **Methods**: camelCase (`addNode`, `updateStyles`)
- **Variables**: camelCase (`nodeData`, `currentSelection`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_PHYSICS_CONFIG`)
- **Files**: PascalCase for classes (`GraphNetwork.ts`), camelCase for utilities
- **Interfaces**: PascalCase with descriptive names (`NodeStyles`, `EdgeData`)

## Testing

### Testing Framework

We use Jest with jsdom for comprehensive testing:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Test individual classes and functions
- **Integration Tests**: Test component interactions
- **Performance Tests**: Validate performance characteristics

### Writing Tests

1. Place tests in `tests/unit/` directory
2. Name test files with `.test.ts` extension
3. Follow the Arrange-Act-Assert pattern
4. Use descriptive test names
5. Mock external dependencies

Example:
```typescript
describe('GraphNetwork', () => {
    test('should add node with valid data', () => {
        // Arrange
        const graph = new GraphNetwork('container');
        const nodeData = { id: 'test-1', name: 'Test Node' };

        // Act
        const result = graph.addNode(nodeData);

        // Assert
        expect(result).toBeDefined();
        expect(graph.hasNode('test-1')).toBe(true);
    });
});
```

### Test Coverage

Maintain 80%+ test coverage. Check coverage with:

```bash
npm run test:coverage
```

## Pull Request Process

### Before Submitting

1. Run the full test suite: `npm test`
2. Check linting: `npm run lint`
3. Verify TypeScript compilation: `npm run type-check`
4. Check bundle size: `npm run size`
5. Update documentation if needed
6. Add tests for new features

### PR Requirements

1. **Descriptive Title**: Clearly describe what the PR does
2. **Detailed Description**: Explain the problem and solution
3. **Linked Issues**: Reference any related issues
4. **Breaking Changes**: Clearly document any breaking changes
5. **Tests**: Include tests for new functionality
6. **Documentation**: Update JSDoc comments and docs

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Bundle size checked
```

## Project Structure

```
src/
├── GraphNetwork.ts          # Main graph class
├── Node.ts                  # Node representation
├── Vector.ts               # Mathematical vector operations
├── index.ts                # Library entry point
├── styles.css              # Default styles
├── camera/                 # Camera and viewport control
│   └── CameraController.ts
├── errors/                 # Custom error classes
│   └── GraphErrors.ts
├── highlighting/           # Node/edge highlighting
│   └── HighlightManager.ts
├── interaction/            # Event handling
│   └── EventManager.ts
├── physics/               # Physics simulation
│   └── PhysicsEngine.ts
├── rendering/             # SVG rendering
│   └── SVGRenderer.ts
├── selection/             # Selection management
│   └── SelectionManager.ts
├── styling/               # Dynamic styling
│   └── StyleManager.ts
├── types/                 # TypeScript type definitions
│   ├── index.ts
│   └── styling.ts
└── ui/                    # UI components
    └── UIManager.ts
```

### Architecture Principles

- **Modular Design**: Each manager handles a specific concern
- **Dependency Injection**: Use callbacks for loose coupling
- **Event-Driven**: Emit events for extensibility
- **TypeScript First**: Full type safety throughout

## API Development Guidelines

### Adding New Methods

1. **Follow Naming Patterns**: Use consistent naming with existing APIs
2. **Type Safety**: Provide full TypeScript types
3. **JSDoc Documentation**: Document all parameters and return values
4. **Error Handling**: Use custom error classes with descriptive messages
5. **Event Emission**: Emit events for state changes
6. **Options Pattern**: Use options objects for complex parameters

### Example API Method

```typescript
/**
 * Add a new node to the graph with enhanced validation and positioning options
 * @param nodeData - The node data to add
 * @param options - Additional options for node creation
 * @returns The created Node instance
 * @throws {NodeValidationError} When node data is invalid
 * @throws {NodeExistsError} When node with same ID already exists
 * @example
 * ```typescript
 * const node = graph.addNode(
 *   { id: 'node-1', name: 'My Node', type: 'primary' },
 *   { x: 100, y: 200, animate: true }
 * );
 * ```
 */
addNode(nodeData: T, options: NodeCreationOptions = {}): Node<T> {
    // Implementation...
}
```

### Breaking Changes

- Document breaking changes in pull requests
- Update version according to semver
- Provide migration guide for major changes
- Consider deprecation warnings before removal

## Performance Considerations

### Bundle Size

- Keep bundle size under 25KB gzipped
- Check size with `npm run size` before commits
- Consider code splitting for large features

### Runtime Performance

- Target 60fps for 500+ node graphs
- Use efficient algorithms (prefer O(n log n) over O(n²))
- Implement viewport culling for large datasets
- Profile performance with browser dev tools

### Memory Management

- Avoid memory leaks in event listeners
- Clean up DOM references in destroy methods
- Use object pooling for frequently created objects

## Documentation

### JSDoc Comments

All public methods must have comprehensive JSDoc comments:

```typescript
/**
 * Brief description of what the method does
 * @param param1 - Description of parameter
 * @param param2 - Description of parameter with type info
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 * @example
 * ```typescript
 * const result = method(param1, param2);
 * ```
 */
```

### API Documentation

- Run `npm run docs` to generate API documentation
- Documentation is auto-generated from JSDoc comments
- Serve locally with `npm run docs:serve`

### README Updates

Update README.md for:
- New major features
- API changes
- Installation/setup changes
- Example updates

## Getting Help

- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord (link in README)

## License

By contributing to SVG Graph Network, you agree that your contributions will be licensed under the same license as the project.