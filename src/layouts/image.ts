import type { LayoutRenderer } from '../types/index.js';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export const imageRenderer: LayoutRenderer = (slide, _config) => {
  const src = slide.options.src as string ?? '';
  const fit = String(slide.options.fit ?? 'cover');
  const position = String(slide.options.position ?? 'center');
  const caption = slide.options.caption as string | undefined;

  const imgStyle = `object-fit:${fit};object-position:${position};width:100%;height:100%`;
  const captionHtml = caption
    ? `<div class="image-caption">${escapeHtml(caption)}</div>`
    : '';

  return (
    `<div class="slide-content" data-layout="image">` +
    `<div class="image-container">` +
    `<img src="${escapeHtml(src)}" style="${imgStyle}" alt="" />` +
    `</div>` +
    `${captionHtml}` +
    `</div>`
  );
};
