import type { LayoutRenderer } from '../types/index.js';
import { renderMarkdown } from './base.js';

export const sectionRenderer: LayoutRenderer = (slide, _config) => {
  const color = slide.options.color as string | undefined;
  const bgStyle = color ? ` style="background:${color}"` : '';

  const body = renderMarkdown(slide.content);

  return (
    `<div class="slide-content" data-layout="section"${bgStyle}>` +
    `<div class="section-body">${body}</div>` +
    `</div>`
  );
};
