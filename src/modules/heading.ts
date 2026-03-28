import type { Slide, GlobalConfig } from '../types/index.js';
import { escapeHtml, renderMarkdown } from './utils.js';

export function renderHeading(slide: Slide, _config: GlobalConfig): string {
  let heading = slide.options.heading;

  // Auto-extract first h1 or h2 from content if no explicit heading
  if (!heading && slide.content) {
    const hMatch = slide.content.match(/^#{1,2}\s+(.+)$/m);
    if (hMatch) {
      heading = hMatch[1].trim();
    }
  }

  if (!heading) return '';

  const summary = slide.options.summary;
  const summaryHtml = summary
    ? `<div class="slide-summary">${renderMarkdown(String(summary))}</div>`
    : '';

  return (
    `<div class="module-heading">` +
    `<h1>${escapeHtml(String(heading))}</h1>` +
    summaryHtml +
    `</div>`
  );
}
