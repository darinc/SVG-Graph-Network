# SVGnet - GitHub Pages

This directory contains the GitHub Pages setup for the SVGnet library, showcasing an interactive visualization of the library's module dependencies.

## 🌐 Live Site

Visit the live site at: [https://darinc.github.io/SVGnet/](https://darinc.github.io/SVGnet/)

## 📁 Structure

```
docs/
├── index.html              # Main landing page
├── modules.html            # Interactive module dependency visualization
├── examples/               # Copied examples from /examples
│   ├── basic.html         # Basic network example
│   ├── advanced.html      # Advanced features example
│   └── *.js               # JavaScript files for examples
├── assets/                # Built assets
│   ├── SVGnet.js    # Built library (minified)
│   ├── SVGnet.png   # Image for twitter card
│   ├── SVGnet.css   # Library styles
│   └── modules-data.json       # Generated dependency data
├── api/                   # TypeDoc generated API documentation
└── README.md             # This file
```

## 🎯 Features

### Module Dependency Visualization

The centerpiece of this GitHub Pages site is an interactive visualization showing:

- **38 TypeScript modules** from the `src/` directory
- **89 dependency relationships** between modules
- **17 module categories** (core, rendering, physics, UI, etc.)
- **Interactive filtering** by category and search
- **Real-time statistics** and metrics
- **Node details** on hover/click showing file metrics

### Key Highlights

1. **Dogfooding**: The library visualizes its own architecture
2. **Performance**: Handles 38+ nodes smoothly with physics simulation
3. **Responsive**: Works on desktop, tablet, and mobile
4. **Educational**: Shows real-world module organization patterns

## 🔧 Local Development

To run the GitHub Pages site locally:

```bash
# Build everything needed for GitHub Pages
npm run pages:build

# Serve the docs directory
npx http-server docs -p 8080 -o
```

Or serve individual components:

```bash
# Serve just the API docs
npm run docs:serve

# Build and analyze dependencies
node scripts/analyze-dependencies.cjs
```

## 🚀 Deployment

Deployment is automated via GitHub Actions (`.github/workflows/deploy-pages.yml`):

1. **Triggers**: Push to `main` branch or manual dispatch
2. **Build Steps**:
   - Install dependencies and run tests
   - Build library (`npm run build`)
   - Generate API docs (`npm run docs`)
   - Analyze module dependencies
   - Prepare GitHub Pages content
3. **Deploy**: Automatically deploys to GitHub Pages

## 📊 Module Analysis

The `scripts/analyze-dependencies.cjs` script:

- Parses all TypeScript files in `src/`
- Extracts import relationships
- Categorizes modules by functionality
- Generates metrics (lines of code, exports, etc.)
- Outputs JSON data for visualization

### Module Categories

- **main**: GraphNetwork.ts (entry point)
- **foundation**: Node.ts, Vector.ts (base classes)
- **core**: Data management, dependency injection
- **rendering**: SVG rendering system
- **physics**: Force simulation engine
- **interaction**: User input handling
- **ui**: User interface components
- **events**: Event bus and management
- **highlighting**: Node/edge highlighting
- **selection**: Selection management
- **styling**: Style system
- **theming**: Theme management
- **camera**: Viewport control
- **utils**: Utilities (Logger, etc.)
- **types**: Type definitions
- **errors**: Error classes

## 🎨 Customization

The visualization demonstrates many library features:

- **Custom node colors** based on module category
- **Node sizing** based on lines of code
- **Interactive filtering** and search
- **Physics simulation** with customizable parameters
- **Responsive design** for all screen sizes
- **Touch support** for mobile devices

## 🔗 Links

- [Main Site](https://darinc.github.io/SVGnet/)
- [Module Dependencies](https://darinc.github.io/SVGnet/modules.html)
- [API Documentation](https://darinc.github.io/SVGnet/api/)
- [GitHub Repository](https://github.com/darinc/SVGnet)

## 📈 Statistics

The module dependency analysis reveals:

- **Most imported module**: `types/index.ts` (22 imports)
- **Foundation dependencies**: `Node.ts` (16 imports), `Vector.ts` (10 imports)
- **Zero circular dependencies** detected
- **Clean architecture** with proper separation of concerns

This analysis helps developers understand the codebase structure and identify potential refactoring opportunities.

---

*This GitHub Pages site serves as both documentation and a live demonstration of the SVGnet library's capabilities.*
