// ============================================================
// Grid Engine — Generates HTML from layout definitions + slots
// ============================================================

import type { LayoutDefinition, ResolvedSlot, Slot, GridRenderOptions } from './types.js';
import type { GlobalConfig, RenderContext, CANVAS_SIZES } from '../types/index.js';

/**
 * Render a complete slide using the grid engine.
 *
 * This is the single entry point that replaces all per-layout renderers.
 * It generates a consistent HTML structure:
 *
 *   <div class="slide-content" data-layout="name">
 *     [chrome: header]
 *     <div class="slide-grid" style="grid definitions...">
 *       <div class="slot" style="grid-column/row...">content</div>
 *       ...
 *     </div>
 *     [chrome: footer]
 *   </div>
 */
export function renderGrid(options: GridRenderOptions, config: GlobalConfig, context: RenderContext): string {
  const { layout, slots, containerStyle, containerClass, slideOptions } = options;

  const gridHtml = buildGridContainer(layout, slots);
  const chromeHtml = buildChrome(layout, config, context, slideOptions);

  const extraClass = containerClass ? ` ${containerClass}` : '';
  const extraStyle = containerStyle ? ` style="${containerStyle}"` : '';

  if (layout.fullBleed) {
    return (
      `<div class="slide-content${extraClass}" data-layout="${layout.name}"${extraStyle}>` +
      gridHtml +
      `</div>`
    );
  }

  return (
    `<div class="slide-content${extraClass}" data-layout="${layout.name}"${extraStyle}>` +
    chromeHtml.header +
    `<div class="slide-body">` +
    gridHtml +
    `</div>` +
    chromeHtml.footer +
    `</div>`
  );
}

/**
 * Build the CSS Grid container with positioned slots.
 */
function buildGridContainer(layout: LayoutDefinition, slots: ResolvedSlot[]): string {
  const cols = layout.cols ?? 'repeat(12, 1fr)';
  const rows = layout.rows;
  const gapRow = layout.gap.row;
  const gapCol = layout.gap.col;

  const styles: string[] = [
    'display:grid',
    `grid-template-columns:${cols}`,
    `grid-template-rows:${rows}`,
    `gap:${gapRow}px ${gapCol}px`,
    'width:100%',
    'height:100%',
    'min-height:0',
  ];

  if (layout.placeContent) {
    styles.push(`place-content:${layout.placeContent}`);
  }
  if (layout.placeItems) {
    styles.push(`place-items:${layout.placeItems}`);
  }

  const slotsHtml = slots.map((rs) => buildSlotElement(rs)).join('\n');

  return (
    `<div class="slide-grid" style="${styles.join(';')}">` +
    slotsHtml +
    `</div>`
  );
}

/**
 * Build a single slot element with grid placement styles.
 */
function buildSlotElement(resolved: ResolvedSlot): string {
  const { slot, html } = resolved;
  const styles: string[] = [];

  // Column placement
  styles.push(`grid-column:${slot.col} / span ${slot.colSpan}`);

  // Row placement
  if (slot.row !== 'auto') {
    const rowEnd = slot.rowSpan && slot.rowSpan > 1 ? ` / span ${slot.rowSpan}` : '';
    styles.push(`grid-row:${slot.row}${rowEnd}`);
  }

  // Alignment
  if (slot.align) {
    styles.push(`align-self:${slot.align}`);
  }
  if (slot.justify) {
    styles.push(`justify-self:${slot.justify}`);
  }

  // Overflow protection
  styles.push('min-width:0', 'min-height:0', 'overflow:hidden');

  return (
    `<div class="slot slot-${slot.id}" data-module="${slot.module}" style="${styles.join(';')}">` +
    html +
    `</div>`
  );
}

/**
 * Build chrome (header + footer) based on layout chrome level.
 */
function buildChrome(
  layout: LayoutDefinition,
  config: GlobalConfig,
  context: RenderContext,
  slideOptions?: Record<string, unknown>,
): { header: string; footer: string } {
  if (layout.chrome === 'none') {
    return { header: '', footer: '' };
  }

  const showHeader = layout.chrome === 'full';
  const showFooter = layout.chrome === 'full' || layout.chrome === 'minimal';

  const header = showHeader ? buildHeader(config, context, slideOptions) : '';
  const footer = showFooter ? buildFooter(config, context, slideOptions) : '';

  return { header, footer };
}

function buildHeader(config: GlobalConfig, _context: RenderContext, slideOptions?: Record<string, unknown>): string {
  const headerText = (slideOptions?.header as string) ?? config.defaults?.header ?? '';
  const logoHtml = config.logo?.path
    ? `<img class="slide-logo" src="${escapeHtml(config.logo.path)}" style="height:${config.logo.height ?? 32}px" alt="">`
    : '';

  const textHtml = headerText ? `<span>${escapeHtml(String(headerText))}</span>` : '';

  return `<div class="slide-header">${textHtml}${logoHtml}</div>`;
}

function buildFooter(config: GlobalConfig, context: RenderContext, slideOptions?: Record<string, unknown>): string {
  const showFooter = slideOptions?.footer ?? config.defaults?.footer ?? false;
  const showPageNumber = slideOptions?.pageNumber ?? config.defaults?.pageNumber ?? false;

  if (!showFooter && !showPageNumber) {
    return `<div class="slide-footer"></div>`;
  }

  const fc = config.footer ?? {};
  const resolve = (tpl?: string) => {
    if (!tpl) return '';
    return tpl
      .replace('{title}', config.title ?? '')
      .replace('{author}', config.author ?? '')
      .replace('{date}', config.date ?? '')
      .replace('{slideNumber}', String(context.slideIndex + 1))
      .replace('{totalSlides}', String(context.totalSlides));
  };

  const left = resolve(fc.left) || '';
  const center = resolve(fc.center) || '';
  const right = resolve(fc.right) || (showPageNumber ? `${context.slideIndex + 1} / ${context.totalSlides}` : '');

  return (
    `<div class="slide-footer">` +
    `<span class="footer-left">${left}</span>` +
    `<span class="footer-center">${center}</span>` +
    `<span class="footer-right">${right}</span>` +
    `</div>`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// Grid Engine CSS — replaces layout-specific CSS in styles.ts
// ============================================================

/**
 * Generate the unified grid engine CSS.
 * This replaces ~400 lines of layout-specific CSS with ~60 lines.
 */
export function generateGridCSS(): string {
  return `
/* ==========================================================
   Grid Engine — Unified Layout System
   All layouts are driven by CSS Grid with inline styles.
   No layout-specific CSS rules needed.
   ========================================================== */

.slide-content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Full-bleed layouts: no padding */
.slide-content[data-layout="cover"],
.slide-content[data-layout="section"],
.slide-content[data-layout="end"] {
  padding: 0;
}

/* Chrome layouts: safe-area padding */
.slide-content:not([data-layout="cover"]):not([data-layout="section"]):not([data-layout="end"]):not([data-layout="blank"]) {
  padding: var(--margin-v) var(--margin-h);
}

/* Full-bleed with centered content */
.slide-content[data-layout="cover"],
.slide-content[data-layout="section"],
.slide-content[data-layout="end"] {
  justify-content: center;
  align-items: center;
  padding: var(--margin-v) var(--margin-h);
}

/* Grid container fills the body area */
.slide-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.slide-grid {
  width: 100%;
  flex: 1;
  min-height: 0;
}

/* Slot: the atomic placement unit */
.slot {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
`.trim();
}
