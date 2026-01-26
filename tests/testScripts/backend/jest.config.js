/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],

  // Run tests sequentially to respect rate limiting
  maxWorkers: 1,

  // Extended timeout to accommodate 90-second delays between test suites
  // 90 seconds = 90,000 ms, plus buffer for test execution
  testTimeout: 300000, // 5 minutes

  // Run tests in a specific order (most critical first)
  testSequencer: './testSequencer.js',

  // Verbose output for detailed logging
  verbose: true,

  // Bail on first failure to save time with rate limits
  bail: false,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles that prevent Jest from exiting
  detectOpenHandles: true,
};
