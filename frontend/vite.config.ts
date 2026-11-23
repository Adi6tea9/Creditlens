import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // Playwright specs are run by `npx playwright test`, not Vitest.
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
});
