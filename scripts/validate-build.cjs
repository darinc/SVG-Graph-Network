/**
 * Build Validation Script
 *
 * Validates that the built distribution files work correctly:
 * - CJS build can be require()'d
 * - ESM build can be import()'d
 * - All expected exports exist
 * - Basic instantiation works
 *
 * Run after build: node scripts/validate-build.cjs
 */

const path = require('path');
const fs = require('fs');

const DIST_DIR = path.join(__dirname, '..', 'dist');

// Expected exports from the library
const EXPECTED_EXPORTS = ['GraphNetwork', 'Vector', 'Node', 'AutoColorGenerator'];

// Build files to validate
const BUILD_FILES = {
  umd: 'SVGnet.min.js',
  esm: 'SVGnet.esm.js',
  cjs: 'SVGnet.cjs',
  css: 'SVGnet.css',
  types: 'index.d.ts'
};

let errors = [];
let warnings = [];

function log(message) {
  console.log(message);
}

function logSuccess(message) {
  console.log(`  \x1b[32m✓\x1b[0m ${message}`);
}

function logError(message) {
  console.log(`  \x1b[31m✗\x1b[0m ${message}`);
  errors.push(message);
}

function logWarning(message) {
  console.log(`  \x1b[33m!\x1b[0m ${message}`);
  warnings.push(message);
}

/**
 * Check that all expected build files exist
 */
function validateFilesExist() {
  log('\n1. Checking build files exist...');

  for (const [format, filename] of Object.entries(BUILD_FILES)) {
    const filepath = path.join(DIST_DIR, filename);
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      logSuccess(`${format}: ${filename} (${sizeKB} KB)`);
    } else {
      logError(`${format}: ${filename} not found`);
    }
  }
}

/**
 * Validate CJS build works with require()
 */
function validateCJS() {
  log('\n2. Validating CJS build (require)...');

  const cjsPath = path.join(DIST_DIR, BUILD_FILES.cjs);

  try {
    const module = require(cjsPath);

    // Check default export
    if (typeof module === 'function' || typeof module.default === 'function') {
      logSuccess('Default export exists');
    } else {
      logError('Default export is not a function');
    }

    // Check named exports
    for (const exportName of EXPECTED_EXPORTS) {
      if (typeof module[exportName] === 'function') {
        logSuccess(`Named export: ${exportName}`);
      } else {
        logError(`Named export missing or invalid: ${exportName}`);
      }
    }

    // Try basic instantiation (without DOM, just check constructor exists)
    const GraphNetwork = module.GraphNetwork || module.default;
    if (GraphNetwork && GraphNetwork.prototype && GraphNetwork.prototype.constructor) {
      logSuccess('GraphNetwork constructor accessible');
    }

    // Test Vector class
    if (module.Vector) {
      const vec = new module.Vector(1, 2);
      if (vec.x === 1 && vec.y === 2) {
        logSuccess('Vector instantiation works');
      } else {
        logError('Vector instantiation failed');
      }
    }

  } catch (err) {
    logError(`CJS require failed: ${err.message}`);
  }
}

/**
 * Validate ESM build works with dynamic import()
 */
async function validateESM() {
  log('\n3. Validating ESM build (import)...');

  const esmPath = path.join(DIST_DIR, BUILD_FILES.esm);
  // Convert to file:// URL for ESM import
  const esmUrl = `file://${esmPath}`;

  try {
    const module = await import(esmUrl);

    // Check default export
    if (typeof module.default === 'function') {
      logSuccess('Default export exists');
    } else {
      logError('Default export is not a function');
    }

    // Check named exports
    for (const exportName of EXPECTED_EXPORTS) {
      if (typeof module[exportName] === 'function') {
        logSuccess(`Named export: ${exportName}`);
      } else {
        logError(`Named export missing or invalid: ${exportName}`);
      }
    }

    // Test Vector class
    if (module.Vector) {
      const vec = new module.Vector(3, 4);
      const magnitude = vec.magnitude();
      if (Math.abs(magnitude - 5) < 0.001) {
        logSuccess('Vector.magnitude() works correctly');
      } else {
        logError(`Vector.magnitude() returned ${magnitude}, expected 5`);
      }
    }

  } catch (err) {
    logError(`ESM import failed: ${err.message}`);
  }
}

/**
 * Validate UMD build structure
 */
function validateUMD() {
  log('\n4. Validating UMD build structure...');

  const umdPath = path.join(DIST_DIR, BUILD_FILES.umd);

  try {
    const content = fs.readFileSync(umdPath, 'utf8');

    // Check for UMD wrapper patterns
    if (content.includes('typeof exports') && content.includes('typeof module')) {
      logSuccess('Contains CommonJS detection');
    } else {
      logWarning('Missing CommonJS detection pattern');
    }

    if (content.includes('typeof define') && content.includes('define.amd')) {
      logSuccess('Contains AMD detection');
    } else {
      logWarning('Missing AMD detection pattern');
    }

    if (content.includes('SVGNet')) {
      logSuccess('Global name "SVGNet" present');
    } else {
      logError('Global name "SVGNet" not found');
    }

    // Check it's minified (no excessive whitespace)
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 100) {
      logSuccess('Build appears to be minified');
    } else {
      logWarning('Build may not be properly minified');
    }

  } catch (err) {
    logError(`UMD validation failed: ${err.message}`);
  }
}

/**
 * Validate TypeScript declarations
 */
function validateTypes() {
  log('\n5. Validating TypeScript declarations...');

  const typesPath = path.join(DIST_DIR, BUILD_FILES.types);

  try {
    const content = fs.readFileSync(typesPath, 'utf8');

    // Check for key exports in declaration file
    if (content.includes('export default GraphNetwork')) {
      logSuccess('Default export declared');
    } else if (content.includes('export { GraphNetwork')) {
      logSuccess('GraphNetwork export declared');
    } else {
      logWarning('GraphNetwork export declaration not found in expected format');
    }

    // Check for type exports
    const typeExports = ['NodeData', 'LinkData', 'GraphConfig', 'ThemeConfig'];
    for (const typeName of typeExports) {
      if (content.includes(typeName)) {
        logSuccess(`Type export: ${typeName}`);
      } else {
        logWarning(`Type export not found: ${typeName}`);
      }
    }

  } catch (err) {
    logError(`Types validation failed: ${err.message}`);
  }
}

/**
 * Validate CSS file
 */
function validateCSS() {
  log('\n6. Validating CSS...');

  const cssPath = path.join(DIST_DIR, BUILD_FILES.css);

  try {
    const content = fs.readFileSync(cssPath, 'utf8');

    if (content.length > 0) {
      logSuccess(`CSS file has content (${(content.length / 1024).toFixed(1)} KB)`);
    } else {
      logError('CSS file is empty');
    }

    // Check for key selectors
    if (content.includes('.graph-network-container') || content.includes('.graph-network-svg')) {
      logSuccess('Contains expected CSS selectors');
    } else {
      logWarning('Expected CSS selectors not found');
    }

  } catch (err) {
    logError(`CSS validation failed: ${err.message}`);
  }
}

/**
 * Main validation runner
 */
async function main() {
  console.log('\n========================================');
  console.log('  SVG Graph Network - Build Validation');
  console.log('========================================');

  // Check dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('\n\x1b[31mError: dist/ directory not found. Run "npm run build" first.\x1b[0m\n');
    process.exit(1);
  }

  // Run all validations
  validateFilesExist();
  validateCJS();
  await validateESM();
  validateUMD();
  validateTypes();
  validateCSS();

  // Summary
  console.log('\n========================================');
  console.log('  Summary');
  console.log('========================================');

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n\x1b[32m All validations passed!\x1b[0m\n');
    process.exit(0);
  } else {
    if (warnings.length > 0) {
      console.log(`\n\x1b[33m Warnings: ${warnings.length}\x1b[0m`);
    }
    if (errors.length > 0) {
      console.log(`\x1b[31m Errors: ${errors.length}\x1b[0m`);
      console.log('\nBuild validation failed. Please fix the errors above.\n');
      process.exit(1);
    }
    console.log('\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('\n\x1b[31mValidation script error:\x1b[0m', err);
  process.exit(1);
});
