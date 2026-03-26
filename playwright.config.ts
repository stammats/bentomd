import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/visual',
  timeout: 15000,
  use: {
    viewport: { width: 1920, height: 1080 },
    browserName: 'chromium',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
