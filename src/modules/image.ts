import type { Slide, GlobalConfig } from '../types/index.js';
import type { Slot } from '../engine/types.js';
import { escapeHtml } from './utils.js';

export function renderImage(slot: Slot, slide: Slide, _config: GlobalConfig): string {
  const src = slide.options.src as string ?? '';
  const fit = String(slide.options.fit ?? 'cover');
  const position = String(slide.options.position ?? 'center');
  const caption = slide.options.caption as string | undefined;

  const captionHtml = caption
    ? `<div class="image-caption">${escapeHtml(caption)}</div>`
    : '';

  return (
    `<div class="module-image" style="width:100%;height:100%;display:flex;flex-direction:column">` +
    `<div style="flex:1;min-height:0;overflow:hidden;border-radius:12px">` +
    `<img src="${escapeHtml(src)}" style="width:100%;height:100%;object-fit:${fit};object-position:${position};display:block" alt="" />` +
    `</div>` +
    captionHtml +
    `</div>`
  );
}
