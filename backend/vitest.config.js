const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Integration tests share one MariaDB; truncation between suites is only
    // safe when files run one at a time.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
    setupFiles: ['tests/setup-env.js'],
    coverage: {
      provider: 'v8',
      include: [
        'app.js',
        'controllers/**/*.js',
        'helpers/**/*.js',
        'middlewares/**/*.js',
        'models/**/*.js',
        'routes/**/*.js',
      ],
      exclude: ['node_modules/**', 'tests/**'],
      reporter: ['text', 'json-summary', 'lcov'],
    },
  },
});
