import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text', 'clover'],
      include: ['src/lib/api.js', 'src/lib/listPage.js', 'src/main.js', 'src/router.js'],
      exclude: ['**/tests/**', '**/node_modules/**']
    },
    include: ['src/tests/**/*.test.js'],
    reporters: [
      'default',
      ['vitest-sonar-reporter', { outputFile: 'coverage/test-report.xml' }]
    ]
  }
});
