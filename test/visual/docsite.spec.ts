import { test } from '@playwright/test';
import { join } from 'path';

const SCREENSHOTS_DIR = join(import.meta.dirname, 'screenshots');
const BASE = 'http://localhost:3081';

const PAGES = [
  'layouts/mermaid',
  'layouts/bento',
  'layouts/features',
  'layouts/stats',
  'layouts/cover',
];

for (const path of PAGES) {
  test(`docsite: ${path}`, async ({ page }) => {
    await page.goto(`${BASE}/${path}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(4000);
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, `docsite-${path.replace('/', '-')}.png`),
      fullPage: true,
    });
  });
}
