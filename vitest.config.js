import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
        '**/dist/',
        '**/build/',
        '**/*.test.js',
        '**/*.spec.js',
        'firebase.json',
        '.firebaserc'
      ],
      include: ['assets/scripts/**/*.js'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60
      }
    },
    include: ['tests/unit/**/*.test.js', 'tests/integration/**/*.test.js'],
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './assets/scripts'),
      '@tests': resolve(__dirname, './tests')
    }
  }
});
