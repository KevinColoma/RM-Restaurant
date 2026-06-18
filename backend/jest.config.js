module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**'
  ],
  coverageReporters: ['lcov', 'text', 'clover'],
  testMatch: ['**/tests/**/*.test.js'],
  testResultsProcessor: 'jest-sonar-reporter'
};
