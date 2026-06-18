module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  maxWorkers: 1,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'app.js',
    'db.js',
    'jwt.js',
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
