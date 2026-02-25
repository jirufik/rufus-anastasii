import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    name: 'rufus-anastasii-backend',
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    include: ['src/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@libs': resolve(__dirname, 'src/libs'),
    },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
