import type { LayoutRenderer } from '../types/index.js';
import { renderMarkdown, escapeHtml } from './base.js';

/**
 * Cover slide — full-bleed centered display.
 * Does NOT use the 5-layer page structure; it's a custom layout.
 *
 * Renders h1 as title (4.5rem), h2 as subtitle (2rem), rest as body.
 * Supports background color/image with overlay.
 */
export const coverRenderer: LayoutRenderer = (slide, _config, _context) => {
  const { background, align = 'center', overlay, color } = slide.options;

  const alignClass = `cover-align-${align}`;

  let bgStyle = '';
  let overlayHtml = '';

  if (background) {
    const bg = String(background);
    if (bg.startsWith('http') || bg.startsWith('/') || bg.startsWith('.')) {
      bgStyle = `background-image: url('${escapeHtml(bg)}'); background-size: cover; background-position: center;`;
      const overlayOpacity = overlay !== undefined ? Number(overlay) : 0.4;
      overlayHtml = `<div class="cover-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,${overlayOpacity});pointer-events:none"></div>`;
    } else {
      bgStyle = `background: ${bg};`;
    }
  }

  // If explicit text color, apply it
  const colorStyle = color ? `color: ${color};` : '';
  const styleAttr = bgStyle || colorStyle ? ` style="${bgStyle}${colorStyle}"` : '';

  const body = renderMarkdown(slide.content);

  return `<div class="slide-content" data-layout="cover"${styleAttr}>
  ${overlayHtml}<div class="cover-body ${alignClass}">${body}</div>
</div>`;
};
