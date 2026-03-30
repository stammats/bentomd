import type { Slide, GlobalConfig, FeatureItem } from '../types/index.js';
import { renderIcon, renderMarkdown } from './utils.js';

export function renderCardGrid(slide: Slide, config: GlobalConfig): string {
  const items = (slide.items ?? slide.rawItems ?? []) as FeatureItem[];
  const columns = Number(slide.options.columns ?? Math.min(items.length, 3));
  const style = String(slide.options.style ?? 'card');

  const cards = items
    .map((item) => {
      const iconHtml = item.icon
        ? `<div class="feature-icon">${renderIcon(item.icon, { size: item.iconSize ?? 48, color: item.iconColor })}</div>`
        : '';
      const titleHtml = item.title ? `<h3 class="feature-title">${item.title}</h3>` : '';
      const descHtml = item.description
        ? `<p class="feature-desc">${renderMarkdown(item.description).replace(/<\/?p>/g, '')}</p>`
        : '';

      const content = `${iconHtml}${titleHtml}${descHtml}`;

      if (item.link) {
        return `<a class="feature-card feature-style-${style}" href="${item.link}">${content}</a>`;
      }
      return `<div class="feature-card feature-style-${style}">${content}</div>`;
    })
    .join('\n');

  return (
    `<div class="module-card-grid" style="display:grid;grid-template-columns:repeat(${columns},1fr);gap:24px;width:100%;height:100%;align-content:center">` +
    cards +
    `</div>`
  );
}
