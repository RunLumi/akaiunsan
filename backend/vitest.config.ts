const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  resolve: {
    // sources are TypeScript now — extensionless require()/import of
    // './helpers/x' must prefer the .ts file
    extensions: ['.mts', '.ts', '.mjs', '.js', '.jsx', '.tsx', '.json'],
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Integration tests share one MariaDB; truncation between suites is only
    // safe when files run one at a time.
    fileParallelism: false,
    // Fresh module registry per file: suites that vi.mock models/pino must not
    // poison later suites sharing the worker (observed as random 401/500s).
    isolate: true,
    pool: 'forks',
    // Vitest 4 moved these out of poolOptions. Keep one isolated fork at a
    // time so shared Postgres fixtures cannot overwrite another suite's rows.
    singleFork: false,
    maxWorkers: 1,
    minWorkers: 1,
    testTimeout: 60000,
    hookTimeout: 120000,
    setupFiles: ['tests/setup-env.js'],
    coverage: {
      provider: 'v8',
      include: [
        'app.ts',
        'controllers/**/*.ts',
        'helpers/**/*.ts',
        'middlewares/**/*.ts',
        'models/**/*.ts',
        'routes/**/*.ts',
      ],
      exclude: ['node_modules/**', 'tests/**'],
      reporter: ['text', 'json-summary', 'lcov'],
    },
  },
});
