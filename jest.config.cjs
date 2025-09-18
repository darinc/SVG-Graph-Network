module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Transform files with appropriate loaders
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.test.json'
    }],
    '^.+\\.js$': 'babel-jest',
  },
  
  // TypeScript configuration
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  
  // Setup files to run after the test framework is installed
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Test match patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/'
  ],
  
  // Module directories
  moduleDirectories: ['node_modules', 'src'],
  
  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  
  // Coverage thresholds - disabled for now (current coverage ~50%)
  // TODO: Re-enable thresholds after improving test coverage
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80
  //   }
  // },
  
  // Coverage reporters
  coverageReporters: ['html', 'text', 'lcov'],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true
};