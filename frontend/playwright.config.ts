import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4173',
  },
  // 4173: production build (run `npm run build` first) for axe/submit tests.
  // 4174: mock-mode build so the screenshot shows the Preview note, as in the prototype.
  webServer: [
    {
      command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command:
        'npm run build:mock && npm run preview -- --host 127.0.0.1 --port 4174 --strictPort --outDir dist-mock',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
