import type { Slide, GlobalConfig } from '../types/index.js';
import type { LayoutDefinition } from '../engine/types.js';
import { renderMarkdown, escapeHtml } from './utils.js';

export function renderHero(slide: Slide, layout: LayoutDefinition, _config: GlobalConfig): string {
  const { background, overlay } = slide.options;

  // Overlay for background images
  let overlayHtml = '';
  if (background) {
    const bg = String(background);
    if (bg.startsWith('http') || bg.startsWith('/') || bg.startsWith('.')) {
      const overlayOpacity = overlay !== undefined ? Number(overlay) : 0.4;
      overlayHtml = `<div class="cover-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,${overlayOpacity});pointer-events:none;z-index:0"></div>`;
    }
  }

  const align = slide.options.align ?? 'center';
  const alignClass = `hero-align-${align}`;

  const body = renderMarkdown(slide.content);

  return (
    overlayHtml +
    `<div class="module-hero ${alignClass}" style="z-index:1;position:relative">` +
    body +
    `</div>`
  );
}
