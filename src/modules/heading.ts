import type { Slide, GlobalConfig } from '../types/index.js';
import { escapeHtml } from './utils.js';

export function renderHeading(slide: Slide, _config: GlobalConfig): string {
  let heading = slide.options.heading;

  // Auto-extract first h1 from content if no explicit heading
  if (!heading && slide.content) {
    const h1Match = slide.content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      heading = h1Match[1].trim();
    }
  }

  if (!heading) return '';

  const summary = slide.options.summary;
  const summaryHtml = summary
    ? `<p class="slide-summary">${escapeHtml(String(summary))}</p>`
    : '';

  return (
    `<div class="module-heading">` +
    `<h1>${escapeHtml(String(heading))}</h1>` +
    summaryHtml +
    `</div>`
  );
}
