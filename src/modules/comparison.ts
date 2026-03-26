import type { Slide, GlobalConfig, ComparisonItem } from '../types/index.js';
import { escapeHtml } from './utils.js';

export function renderComparison(slide: Slide, _config: GlobalConfig): string {
  const items = (slide.items ?? slide.rawItems ?? []) as ComparisonItem[];
  const columns = Math.min(items.length, 4);

  const cards = items
    .map((item) => {
      const highlightClass = item.highlight ? ' highlight' : '';
      const labelHtml = `<div class="comparison-label">${escapeHtml(item.label)}</div>`;
      const priceHtml = item.price
        ? `<div class="comparison-price">${escapeHtml(item.price)}</div>`
        : '';
      const featuresHtml = item.features
        ? `<ul class="comparison-features">${item.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>`
        : '';

      return (
        `<div class="comparison-card${highlightClass}">` +
        labelHtml +
        priceHtml +
        featuresHtml +
        `</div>`
      );
    })
    .join('\n');

  return (
    `<div class="module-comparison" style="display:grid;grid-template-columns:repeat(${columns},1fr);gap:24px;height:100%;align-items:stretch">` +
    cards +
    `</div>`
  );
}
