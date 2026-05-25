// Jest setup file for global test configuration
// Global setup for all tests
beforeEach(() => {
  // Store original environment variables
  global.originalEnv = { ...process.env };
});

afterEach(() => {
  // Restore original environment variables after each test
  process.env = { ...global.originalEnv };
});