import type { Slide, GlobalConfig, StatItem } from '../types/index.js';
import { renderIcon } from './utils.js';

export function renderStatGrid(slide: Slide, config: GlobalConfig): string {
  const items = (slide.items ?? slide.rawItems ?? []) as StatItem[];
  const columns = Math.min(Number(slide.options.columns ?? items.length), 4);
  const iconDefaults = config.icons ?? {};

  const cards = items
    .map((item) => {
      const iconHtml = item.icon
        ? `<div class="stat-icon">${renderIcon(item.icon, { size: 40, ...iconDefaults })}</div>`
        : '';

      const trendHtml = item.trend
        ? (() => {
            const dir = item.trend.startsWith('+') || item.trend.startsWith('↑') ? 'up' : 'down';
            return `<div class="stat-trend stat-trend-${dir}">${item.trend}</div>`;
          })()
        : '';

      return (
        `<div class="stat-card">` +
        iconHtml +
        `<div class="stat-value">${item.value}</div>` +
        `<div class="stat-label">${item.label}</div>` +
        trendHtml +
        `</div>`
      );
    })
    .join('\n');

  return (
    `<div class="module-stat-grid" style="display:grid;grid-template-columns:repeat(${columns},1fr);gap:24px;width:100%;height:100%;align-content:center">` +
    cards +
    `</div>`
  );
}
