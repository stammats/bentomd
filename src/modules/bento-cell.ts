import type { Slide, GlobalConfig, BentoCell } from '../types/index.js';
import type { Slot } from '../engine/types.js';
import { renderMarkdown, renderIcon, escapeHtml } from './utils.js';

export function renderBentoCell(slot: Slot, slide: Slide, config: GlobalConfig): string {
  const items = (slide.items ?? slide.rawItems ?? []) as BentoCell[];
  const match = slot.id.match(/cell-(\d+)/);
  const idx = match ? parseInt(match[1], 10) : 0;
  const cell = items[idx];

  if (!cell) return '';

  // Determine layout direction based on cell pixel aspect ratio.
  // Approximate pixel size from grid dimensions:
  //   width  ≈ (colSpan / 12) × 1760
  //   height ≈ (rowSpan / gridRows) × 608
  // Cells wider than 1.3:1 use horizontal layout (icon + title in a row).
  const colSpan = slot.colSpan ?? 4;
  const rowSpan = slot.rowSpan ?? 1;
  const gridRows = slot.gridRows ?? 1;
  const pxWidth = (colSpan / 12) * 1760;
  const pxHeight = (rowSpan / gridRows) * 608;
  const pixelRatio = pxWidth / pxHeight;
  const isWide = pixelRatio > 1.3;

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

  // Full-bleed image cell: image is the sole content (no icon, no description, no body text).
  // Title-only overlay is allowed. If there's any text content besides title, render inline.
  const hasBodyContent = !!(cell.icon || cell.description || cell.content || cell.value);
  if (cell.image && !hasBodyContent) {
    return renderImageCell(cell, styles);
  }

  // Padding for non-image cells
  styles.push('padding:48px');

  // Content alignment
  if (cell.align === 'center') {
    styles.push('align-items:center', 'text-align:center', 'justify-content:center');
  } else {
    styles.push('justify-content:center');
  }

  // Build title HTML
  let titleTag = '';
  if (cell.title) {
    const titleHtml = escapeHtml(cell.title)
      .replace(/\*\*([^*]+)\*\*/g, '<br><span class="bento-value">$1</span>');
    if (titleHtml.includes('bento-value')) {
      const cleaned = titleHtml.replace(/^(<br>)/, '');
      titleTag = `<div class="bento-title">${cleaned}</div>`;
    } else {
      titleTag = `<h3 class="bento-title">${titleHtml}</h3>`;
    }
  }

  // Build body parts (description, content, mermaid, image — everything below title)
  const bodyParts: string[] = [];
  if (cell.description) {
    bodyParts.push(`<div class="bento-desc">${renderMarkdown(cell.description)}</div>`);
  }
  if (cell.content) {
    bodyParts.push(`<div class="bento-content">${renderMarkdown(cell.content)}</div>`);
  }
  if (cell.mermaid) {
    bodyParts.push(`<pre class="mermaid">${cell.mermaid}</pre>`);
  }
  if (cell.image) {
    bodyParts.push(`<div class="bento-inline-image"><img src="${escapeHtml(cell.image)}" alt="${escapeHtml(cell.title ?? '')}" /></div>`);
  }

  const parts: string[] = [];

  if (cell.icon && isWide) {
    // Wide cell: icon left, text right. Put text-only desc in right column;
    // heavy content (charts, mermaid, images) stays below at full width.
    const iconHtml = `<div class="bento-icon">${renderIcon(cell.icon)}</div>`;
    const descHasHeavy = cell.description && /```(chart|mermaid)/.test(cell.description);
    const textBodyParts = descHasHeavy ? [] : bodyParts.filter(p => p.includes('bento-desc'));
    const heavyParts = descHasHeavy ? bodyParts : bodyParts.filter(p => !p.includes('bento-desc'));
    const rightCol = [titleTag, ...textBodyParts].filter(Boolean).join('\n');
    const headerHtml = `<div class="bento-horizontal">${iconHtml}<div class="bento-text">${rightCol}</div></div>`;
    parts.push(headerHtml);
    parts.push(...heavyParts);
  } else {
    // Vertical stack: icon on top, title, then body
    if (cell.icon) {
      parts.push(`<div class="bento-icon">${renderIcon(cell.icon)}</div>`);
    }
    if (titleTag) parts.push(titleTag);
    parts.push(...bodyParts);
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
    const titleHtml = escapeHtml(cell.title)
      .replace(/\*\*([^*]+)\*\*/g, '<span class="bento-value">$1</span>');
    const tag = titleHtml.includes('bento-value') ? 'div' : 'h3';
    overlayParts.push(`<${tag} class="bento-title">${titleHtml}</${tag}>`);
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
