module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Module file extensions for importing
  moduleFileExtensions: ['js', 'json'],
  
  // Transform files with babel
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  
  // Setup files to run after the test framework is installed
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test match patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
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
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
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