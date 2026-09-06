// vitest/config rather than vite, because the `test` block below is Vitest's and
// vite's own defineConfig does not know about it.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Geodata is fetched per region set at runtime and must stay out of the app
// shell, so the shell's size can be judged on its own (see ADR-010 and
// tools/report-bundle-size.mjs).
export default defineConfig({
  // A domain of our own serves from the root; GitHub Pages without one serves
  // from /<repo>/. Set by the deploy workflow so the same build works either
  // way, and so nobody has to remember to change it by hand.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    // Reporting only. The build does not fail on size; the number is printed so
    // the trade stays visible while the app is still small enough to change.
    chunkSizeWarningLimit: 1000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // game-core is pure and must stay runnable without a DOM, so it is also
    // exercised in a node environment.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**'],
  },
});
