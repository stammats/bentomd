import type { LayoutRenderer, StatItem } from '../types/index.js';
import { renderIcon, wrapSlide } from './base.js';

export const statsRenderer: LayoutRenderer = (slide, config) => {
  const items = (slide.items ?? slide.rawItems ?? []) as StatItem[];
  const columns = Math.min(Number(slide.options.columns ?? items.length), 4);

  const iconDefaults = config.icons ?? {};

  const cards = items
    .map((item) => {
      const iconHtml = item.icon
        ? `<div class="stat-icon">${renderIcon(item.icon, { size: 32, ...iconDefaults })}</div>`
        : '';

      const trendHtml = item.trend
        ? (() => {
            const dir = item.trend.startsWith('+') || item.trend.startsWith('↑') ? 'up' : 'down';
            return `<div class="stat-trend stat-trend-${dir}">${item.trend}</div>`;
          })()
        : '';

      return (
        `<div class="stat-card">` +
        `${iconHtml}` +
        `<div class="stat-value">${item.value}</div>` +
        `<div class="stat-label">${item.label}</div>` +
        `${trendHtml}` +
        `</div>`
      );
    })
    .join('\n');

  const inner = `<div class="stats-grid" style="grid-template-columns: repeat(${columns}, 1fr)">${cards}</div>`;

  return wrapSlide('stats', inner);
};
