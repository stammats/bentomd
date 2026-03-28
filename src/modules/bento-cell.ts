import type { Slide, GlobalConfig, BentoCell } from '../types/index.js';
import type { Slot } from '../engine/types.js';
import { renderMarkdown, renderIcon, escapeHtml } from './utils.js';

export function renderBentoCell(slot: Slot, slide: Slide, config: GlobalConfig): string {
  const items = (slide.items ?? slide.rawItems ?? []) as BentoCell[];
  const match = slot.id.match(/cell-(\d+)/);
  const idx = match ? parseInt(match[1], 10) : 0;
  const cell = items[idx];

  if (!cell) return '';

  // Determine layout direction based on cell aspect ratio.
  // colSpan/rowSpan approximates the aspect ratio on a 12-col grid.
  // Wide cells (ratio > 4) use horizontal layout for icon+value;
  // tall or square cells keep vertical stacking.
  const colSpan = slot.colSpan ?? 4;
  const rowSpan = slot.rowSpan ?? 1;
  const isWide = colSpan / rowSpan > 4;

  // Build inline styles
  const borderRadius = config.borderRadius ?? 40;
  const styles: string[] = [
    'display:flex',
    'flex-direction:column',
    `border-radius:${borderRadius}px`,
    'height:100%',
    'overflow:hidden',
  ];

  // Background + text color from cell theme
  const bg = cell.background ?? config.palette?.surface ?? '#dfe6e9';
  styles.push(`background:${bg}`);
  if (cell.color) {
    styles.push(`color:${cell.color}`);
  }
  if (cell.border) {
    styles.push(`border:2px solid ${cell.border}`);
  }

  // Full-bleed image cell (image only, no icon/value — title overlays)
  if (cell.image && !cell.icon && !cell.value) {
    return renderImageCell(cell, styles);
  }

  // Padding for non-image cells
  styles.push('padding:40px');

  // Content alignment
  if (cell.align === 'center') {
    styles.push('align-items:center', 'text-align:center', 'justify-content:center');
  } else {
    styles.push('justify-content:center');
  }

  const parts: string[] = [];

  // Icon
  const iconStyle = cell.color ? `color:${cell.color}` : '';
  if (cell.icon) {
    parts.push(`<div class="bento-icon" style="${iconStyle}">${renderIcon(cell.icon, { size: 32 })}</div>`);
  }

  // Title — **bold** parts render large (bento-value style)
  if (cell.title) {
    const titleHtml = escapeHtml(cell.title)
      .replace(/\*\*([^*]+)\*\*/g, '<span class="bento-value">$1</span>');
    // If title contains a bento-value span, wrap in a title div
    if (titleHtml.includes('bento-value')) {
      parts.push(`<div class="bento-title">${titleHtml}</div>`);
    } else {
      parts.push(`<h3 class="bento-title">${titleHtml}</h3>`);
    }
  }
  if (cell.description) {
    parts.push(`<div class="bento-desc">${renderMarkdown(cell.description)}</div>`);
  }
  if (cell.content) {
    parts.push(`<div class="bento-content">${renderMarkdown(cell.content)}</div>`);
  }
  if (cell.mermaid) {
    parts.push(`<pre class="mermaid">${cell.mermaid}</pre>`);
  }

  // Inline image (content image, not background)
  if (cell.image) {
    parts.push(`<div class="bento-inline-image"><img src="${escapeHtml(cell.image)}" alt="${escapeHtml(cell.title ?? '')}" /></div>`);
  }

  return (
    `<div class="bento-cell" style="${styles.join(';')}">` +
    parts.join('\n') +
    `</div>`
  );
}

function renderImageCell(cell: BentoCell, baseStyles: string[]): string {
  const styles = [...baseStyles, 'position:relative'];

  const overlayParts: string[] = [];
  if (cell.title) {
    overlayParts.push(`<h3 class="bento-title">${escapeHtml(cell.title)}</h3>`);
  }
  if (cell.description) {
    overlayParts.push(`<p class="bento-desc">${escapeHtml(cell.description)}</p>`);
  }

  const overlayHtml = overlayParts.length > 0
    ? `<div class="bento-image-overlay">${overlayParts.join('\n')}</div>`
    : '';

  return (
    `<div class="bento-cell bento-cell-image" style="${styles.join(';')}">` +
    `<img src="${escapeHtml(cell.image!)}" alt="${escapeHtml(cell.title ?? '')}" style="width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0" />` +
    overlayHtml +
    `</div>`
  );
}
