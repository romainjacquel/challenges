module.exports = {
  // Use Node.js environment for testing (not browser)
  testEnvironment: 'node',

  // Directory where Jest should output coverage files
  coverageDirectory: 'coverage',

  // Collect coverage from these files
  collectCoverageFrom: [
    'src/**/*.js',           // All JS files in src
    '!src/**/*.test.js',     // Exclude test files
    '!src/index.js'          // Exclude entry point
  ],

  // Pattern to find test files
  testMatch: [
    '**/__tests__/**/*.js',  // Files in __tests__ folders
    '**/*.test.js',          // Files ending with .test.js
    '**/*.spec.js'           // Files ending with .spec.js
  ],

  // Show detailed test results
  verbose: true,

  // Timeout for each test (10 seconds)
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Coverage thresholds (optional - remove if too strict)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
