import { test } from '@playwright/test';

test('mermaid full css debug', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3081/layouts/mermaid', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);

  const frame = page.frames().find(f => f.url() !== page.url());
  if (!frame) { console.log('No iframe found'); return; }

  const info = await frame.evaluate(() => {
    const svg = document.querySelector('.mermaid svg');
    if (!svg) return 'No SVG';

    const node = svg.querySelector('g.node');
    if (!node) return 'No nodes';

    const fo = node.querySelector('foreignObject');
    if (!fo) return 'No foreignObject';

    // Walk every element inside foreignObject
    const elements = fo.querySelectorAll('*');
    const results: any[] = [];

    for (const el of Array.from(elements)) {
      const cs = getComputedStyle(el);
      results.push({
        tag: el.tagName,
        class: el.className || '(none)',
        text: el.textContent?.slice(0, 15),
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        margin: cs.margin,
        padding: cs.padding,
        boxSizing: cs.boxSizing,
        display: cs.display,
        width: cs.width,
        height: cs.height,
        overflow: cs.overflow,
      });
    }

    return {
      foWidth: fo.getAttribute('width'),
      foHeight: fo.getAttribute('height'),
      foComputedWidth: getComputedStyle(fo).width,
      foComputedHeight: getComputedStyle(fo).height,
      children: results,
    };
  });

  console.log(JSON.stringify(info, null, 2));
});
