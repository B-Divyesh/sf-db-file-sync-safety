import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/site',
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite preview --config vite.config.ts --host 127.0.0.1',
    port: 4173,
    reuseExistingServer: true,
  },
});
