import type { LayoutRenderer, FeatureItem } from '../types/index.js';
import { renderIcon, renderMarkdown, wrapSlide } from './base.js';

export const featuresRenderer: LayoutRenderer = (slide, config, _context) => {
  const items = (slide.items ?? slide.rawItems ?? []) as FeatureItem[];
  const columns = Number(slide.options.columns ?? 3);
  const style = String(slide.options.style ?? 'card');

  const iconDefaults = config.icons ?? {};

  const cards = items
    .map((item) => {
      const iconName = item.icon;
      const title = item.title;
      const description = item.description;
      const link = item.link;

      const iconOpts = {
        size: item.iconSize ?? iconDefaults.size ?? 32,
        strokeWidth: item.iconStrokeWidth ?? iconDefaults.strokeWidth,
        color: item.iconColor ?? iconDefaults.color,
      };

      const iconHtml = iconName
        ? `<div class="feature-icon">${renderIcon(iconName, iconOpts)}</div>`
        : '';
      const titleHtml = title ? `<h3 class="feature-title">${title}</h3>` : '';
      const descHtml = description
        ? `<p class="feature-desc">${renderMarkdown(description).replace(/<\/?p>/g, '')}</p>`
        : '';

      const content = `${iconHtml}${titleHtml}${descHtml}`;

      if (link) {
        return `<a class="feature-card feature-style-${style}" href="${link}">${content}</a>`;
      }
      return `<div class="feature-card feature-style-${style}">${content}</div>`;
    })
    .join('\n');

  const inner = `<div class="features-grid" style="grid-template-columns: repeat(${columns}, 1fr)">${cards}</div>`;

  return wrapSlide('features', inner);
};
