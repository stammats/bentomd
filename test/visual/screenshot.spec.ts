/**
 * Visual screenshot test — captures each layout as a PNG.
 * Run: npx playwright test test/visual/screenshot.spec.ts
 */
import { test } from '@playwright/test';
import { readdirSync } from 'fs';
import { join } from 'path';

const PAGES_DIR = join(import.meta.dirname, 'pages');
const SCREENSHOTS_DIR = join(import.meta.dirname, 'screenshots');

const pages = readdirSync(PAGES_DIR)
  .filter((f) => f.endsWith('.html'))
  .map((f) => f.replace('.html', ''));

for (const layout of pages) {
  test(`screenshot: ${layout}`, async ({ page }) => {
    const filePath = join(PAGES_DIR, `${layout}.html`);
    await page.goto(`file://${filePath}`);
    // Wait for fonts
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: join(SCREENSHOTS_DIR, `${layout}.png`),
      fullPage: false,
    });
  });
}
