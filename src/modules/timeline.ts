import type { Slide, GlobalConfig, TimelineItem } from '../types/index.js';
import { escapeHtml } from './utils.js';

export function renderTimeline(slide: Slide, _config: GlobalConfig): string {
  const items = (slide.items ?? slide.rawItems ?? []) as TimelineItem[];

  const entries = items
    .map((item) => {
      const activeClass = item.active ? ' active' : '';
      const dateHtml = item.date ? `<div class="timeline-date">${escapeHtml(item.date)}</div>` : '';
      const titleHtml = `<h3>${escapeHtml(item.title)}</h3>`;
      const descHtml = item.description ? `<p>${escapeHtml(item.description)}</p>` : '';

      return `<div class="timeline-item${activeClass}">${dateHtml}${titleHtml}${descHtml}</div>`;
    })
    .join('\n');

  return `<div class="module-timeline">${entries}</div>`;
}
