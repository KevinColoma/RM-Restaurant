module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/customerController.js',
    'controllers/inventoryController.js',
    'middleware/authMiddleware.js',
    'models/**/*.js',
    'routes/**/*.js',
    'utils/audit.js',
    '!**/node_modules/**'
  ],
  coverageReporters: ['lcov', 'text', 'clover'],
  testMatch: ['**/tests/**/*.test.js'],
  testResultsProcessor: 'jest-sonar-reporter'
};
