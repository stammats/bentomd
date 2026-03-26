import { test } from '@playwright/test';

test('mermaid iframe zoom', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3081/layouts/mermaid', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  const preview = page.locator('iframe[title="Slide Preview"]').first();
  const box = await preview.boundingBox();
  if (box) {
    await page.screenshot({
      path: 'test/visual/screenshots/docsite-mermaid-zoomed.png',
      clip: { x: box.x, y: box.y, width: box.width, height: box.height },
    });
  }
});
