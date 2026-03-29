// ============================================================
// Slot Resolver — Maps slide data to resolved slots
// ============================================================

import type { Slide, GlobalConfig, RenderContext, FeatureItem, StatItem, ChartDataItem, TableModule, QuoteModule, TimelineItem, ComparisonItem, BentoCell } from '../types/index.js';
import type { LayoutDefinition, ResolvedSlot, Slot } from './types.js';
import { layoutRegistry, bentoLayout } from './definitions.js';
import * as modules from '../modules/index.js';

/**
 * Resolve a slide into a layout definition and filled slots.
 *
 * This is the bridge between the parser output (Slide) and
 * the grid engine (LayoutDefinition + ResolvedSlot[]).
 */
export function resolveSlide(
  slide: Slide,
  config: GlobalConfig,
  context: RenderContext,
): { layout: LayoutDefinition; slots: ResolvedSlot[]; containerStyle?: string; slideOptions: Record<string, unknown> } {
  const layoutDef = getLayoutDefinition(slide);
  let containerStyle: string | undefined;

  // Handle dynamic layouts (bento, two-column ratio variants)
  const adjusted = adjustLayout(layoutDef, slide);

  // Handle background styles (any layout with background: option)
  if (slide.options.background || slide.options.color) {
    containerStyle = resolveBackgroundStyle(slide);
  }

  // Fill each slot with rendered module content
  const resolvedSlots = resolveSlots(adjusted, slide, config, context);

  return { layout: adjusted, slots: resolvedSlots, containerStyle, slideOptions: slide.options as Record<string, unknown> };
}

/**
 * Look up the layout definition for a slide.
 */
function getLayoutDefinition(slide: Slide): LayoutDefinition {
  const name = slide.layout || 'default';
  return layoutRegistry[name] ?? layoutRegistry['default'];
}

/**
 * Adjust layout definition based on slide options.
 * e.g., two-column with ratio "2:1" changes column spans.
 */
// Layouts that are handled by the bento engine
const BENTO_LAYOUTS = new Set([
  'bento', 'features', 'stats', 'comparison',
  'three-column', 'image-left', 'image-right', 'grid',
]);

function adjustLayout(layout: LayoutDefinition, slide: Slide): LayoutDefinition {
  // Two-column ratio adjustment
  if (layout.name === 'two-column' && slide.options.ratio) {
    return adjustTwoColumnRatio(layout, String(slide.options.ratio));
  }

  // Bento and all aliases: generate slots from items
  if (BENTO_LAYOUTS.has(slide.layout || 'default')) {
    return resolveBentoLayout(slide);
  }

  // Auto-bento: default layout with ### items → treat as bento
  if (layout.name === 'default' && slide.content?.match(/^###\s/m)) {
    return resolveBentoLayout(slide);
  }

  return layout;
}

/**
 * Adjust two-column layout based on ratio option.
 */
function adjustTwoColumnRatio(layout: LayoutDefinition, ratio: string): LayoutDefinition {
  const ratioMap: Record<string, [number, number]> = {
    '1:1': [6, 6],
    '2:1': [8, 4],
    '1:2': [4, 8],
    '3:2': [7, 5],
    '2:3': [5, 7],
  };

  const [leftSpan, rightSpan] = ratioMap[ratio] ?? [6, 6];

  return {
    ...layout,
    slots: layout.slots.map((slot) => {
      if (slot.id === 'left') return { ...slot, colSpan: leftSpan };
      if (slot.id === 'right') return { ...slot, col: leftSpan + 1, colSpan: rightSpan };
      return slot;
    }),
  };
}

/**
 * Size keyword → (colSpan, rowSpan) mapping.
 * Based on a 12-column, 3-row grid (matching bentoLayout).
 */
const BENTO_SIZES: Record<string, { colSpan: number; rowSpan: number }> = {
  sm:   { colSpan: 4,  rowSpan: 1 },  // 1/3 width
  md:   { colSpan: 6,  rowSpan: 1 },  // 1/2 width
  lg:   { colSpan: 8,  rowSpan: 1 },  // 2/3 width
  wide: { colSpan: 12, rowSpan: 1 },  // full width
  tall: { colSpan: 6,  rowSpan: 2 },  // 1/2 width, 2 rows
  hero: { colSpan: 8,  rowSpan: 2 },  // 2/3 width, 2 rows
  full: { colSpan: 12, rowSpan: 2 },  // full width, 2 rows
};

/**
 * Parse a bento size — either a keyword or explicit "CxR" notation.
 */
function parseBentoSize(cell: BentoCell): { colSpan: number; rowSpan: number } {
  const raw = cell.size ?? cell.span;
  if (!raw) return BENTO_SIZES.sm;

  // Keyword lookup
  const keyword = BENTO_SIZES[raw.toLowerCase()];
  if (keyword) return keyword;

  // Explicit "CxR" notation (e.g. "6x2", "4x1")
  const match = raw.match(/^(\d+)\s*[x×]\s*(\d+)$/i);
  if (match) {
    return {
      colSpan: Math.min(parseInt(match[1], 10) || 4, 12),
      rowSpan: Math.max(parseInt(match[2], 10) || 1, 1),
    };
  }

  // Legacy: plain number = colSpan only
  const num = parseInt(raw, 10);
  if (!isNaN(num)) return { colSpan: Math.min(num, 12), rowSpan: 1 };

  return BENTO_SIZES.sm;
}

// ---------------------------------------------------------------
// Preset grid templates — optimal layouts for 1–12 items.
// Each template is an array of rows, each row is an array of colSpans.
// All rows sum to 12. Designed for ~square or 2:1 cell proportions.
// ---------------------------------------------------------------

const GRID_TEMPLATES: number[][][] = [
  /* 0 */ [],
  /* 1 */ [[12]],
  /* 2 */ [[6, 6]],
  /* 3 */ [[4, 4, 4]],
  /* 4 */ [[6, 6], [6, 6]],
  /* 5 */ [[4, 4, 4], [6, 6]],
  /* 6 */ [[4, 4, 4], [4, 4, 4]],
  /* 7 */ [[4, 4, 4], [3, 3, 3, 3]],
  /* 8 */ [[4, 4, 4], [4, 4, 4], [6, 6]],
  /* 9 */ [[4, 4, 4], [4, 4, 4], [4, 4, 4]],
  /* 10 */ [[4, 4, 4], [4, 4, 4], [3, 3, 3, 3]],
  /* 11 */ [[4, 4, 4], [4, 4, 4], [4, 4, 4], [6, 6]],
  /* 12 */ [[4, 4, 4], [4, 4, 4], [4, 4, 4], [4, 4, 4]],
];

/**
 * Check if any item has an explicit size hint (hero, md, lg, etc.)
 */
function hasExplicitSizes(items: BentoCell[]): boolean {
  return items.some((cell) => cell.size || cell.span);
}

/**
 * Generate bento layout slots from BentoCell items.
 * Uses preset grid templates for predictable, balanced layouts.
 * Falls back to bin-packing only when items have explicit size hints.
 */
function resolveBentoLayout(slide: Slide): LayoutDefinition {
  const items = (slide.items ?? slide.rawItems ?? []) as BentoCell[];
  const hasHeading = !!(slide.options.heading || slide.content?.match(/^#{1,2}\s+/m));

  let slots: Slot[];
  let numRows: number;

  if (hasExplicitSizes(items)) {
    // Explicit sizes → use bin-packing for those items
    const result = resolveBentoWithBinPacking(items, hasHeading);
    slots = result.slots;
    numRows = result.numRows;
  } else {
    // No explicit sizes → use preset template
    const count = Math.min(items.length, 12);
    const template = GRID_TEMPLATES[count] ?? GRID_TEMPLATES[12];
    const rowOffset = hasHeading ? 1 : 0;

    slots = [];
    let cellIdx = 0;
    for (let rowIdx = 0; rowIdx < template.length; rowIdx++) {
      let col = 1;
      for (const colSpan of template[rowIdx]) {
        if (cellIdx >= items.length) break;
        slots.push({
          id: `cell-${cellIdx}`,
          row: rowIdx + 1 + rowOffset,
          col,
          colSpan,
          rowSpan: 1,
          module: 'raw' as const,
          align: 'stretch',
          justify: 'stretch',
        });
        col += colSpan;
        cellIdx++;
      }
    }
    numRows = template.length;
  }

  // Add heading slot if present
  if (hasHeading) {
    slots.unshift({
      id: 'heading',
      row: 1,
      col: 1,
      colSpan: 12,
      module: 'heading',
    });
  }

  const totalRows = hasHeading ? numRows + 1 : numRows;
  const rowsTemplate = hasHeading
    ? `auto repeat(${numRows}, minmax(160px, 1fr))`
    : `repeat(${totalRows}, minmax(160px, 1fr))`;

  return {
    ...bentoLayout,
    chrome: hasHeading ? 'full' : 'none',
    rows: rowsTemplate,
    slots,
  };
}

/**
 * Bin-packing fallback for items with explicit size hints.
 */
function resolveBentoWithBinPacking(
  items: BentoCell[],
  hasHeading: boolean,
): { slots: Slot[]; numRows: number } {
  const cellSizes = items.map((cell) => parseBentoSize(cell));
  const totalCols = 12;
  const maxRows = Math.max(items.length * 2, 4);
  const grid: boolean[][] = Array.from({ length: maxRows }, () => Array(totalCols).fill(false));
  const rowOffset = hasHeading ? 1 : 0;

  const slots: Slot[] = cellSizes.map((size, i) => {
    const placement = findPlacement(grid, size.colSpan, size.rowSpan, totalCols, maxRows);
    for (let r = placement.row; r < placement.row + size.rowSpan; r++) {
      for (let c = placement.col; c < placement.col + size.colSpan; c++) {
        if (r < maxRows && c < totalCols) grid[r][c] = true;
      }
    }
    return {
      id: `cell-${i}`,
      row: placement.row + 1 + rowOffset,
      col: placement.col + 1,
      colSpan: size.colSpan,
      rowSpan: size.rowSpan,
      module: 'raw' as const,
      align: 'stretch',
      justify: 'stretch',
    };
  });

  // Distribute row-end gaps evenly across single-row cells
  distributeRowGaps(slots, totalCols);

  const numRows = Math.max(...slots.map((s) => (s.row as number) + (s.rowSpan ?? 1) - 1 - rowOffset), 1);
  // Attach gridRows to each slot so modules can compute pixel aspect ratio
  for (const s of slots) s.gridRows = numRows;
  return { slots, numRows };
}

/**
 * Distribute leftover columns in each row evenly across expandable cells.
 * Caps expansion at 1.5× original size. Remaining gap is left empty.
 */
function distributeRowGaps(slots: Slot[], totalCols: number): void {
  // Group single-row cells by their row
  const rowMap = new Map<number, Slot[]>();
  for (const s of slots) {
    const row = s.row as number;
    if (!rowMap.has(row)) rowMap.set(row, []);
    rowMap.get(row)!.push(s);
  }

  for (const [row, rowSlots] of rowMap) {
    // Count occupied cols (including multi-row cells spanning this row)
    let usedCols = 0;
    for (const s of slots) {
      const sRow = s.row as number;
      const sSpan = s.rowSpan ?? 1;
      if (sRow <= row && sRow + sSpan - 1 >= row) {
        usedCols += s.colSpan;
      }
    }

    let gap = totalCols - usedCols;
    if (gap <= 0) continue;

    const expandable = rowSlots.filter((s) => (s.rowSpan ?? 1) === 1);
    if (expandable.length === 0) continue;

    // If only one expandable cell in this row, fill remaining width (no cap)
    // but respect multi-row cells occupying columns in this row
    if (expandable.length === 1) {
      expandable[0].colSpan = totalCols - (usedCols - expandable[0].colSpan);
      // Don't move col position — it's already placed correctly by bin-packing
      continue;
    }

    // Store original sizes
    const origSizes = new Map(expandable.map((s) => [s, s.colSpan]));

    // Round-robin, 1.5× cap
    let changed = true;
    while (gap > 0 && changed) {
      changed = false;
      for (const cell of expandable) {
        if (gap <= 0) break;
        const maxSpan = Math.ceil(origSizes.get(cell)! * 1.5);
        if (cell.colSpan < maxSpan) {
          cell.colSpan++;
          gap--;
          changed = true;
        }
      }
    }

    // Re-lay out col positions left-to-right, skipping multi-row cell columns
    const multiRowCols = new Set<number>();
    for (const s of slots) {
      const sRow = s.row as number;
      const sSpan = s.rowSpan ?? 1;
      if ((s.rowSpan ?? 1) > 1 && sRow <= row && sRow + sSpan - 1 >= row) {
        for (let c = s.col; c < s.col + s.colSpan; c++) multiRowCols.add(c);
      }
    }

    let col = 1;
    for (const cell of expandable) {
      while (multiRowCols.has(col) && col <= totalCols) col++;
      cell.col = col;
      col += cell.colSpan;
    }
  }
}


/**
 * Find the first available position for a cell of given size.
 */
function findPlacement(
  grid: boolean[][],
  colSpan: number,
  rowSpan: number,
  totalCols: number,
  maxRows: number,
): { row: number; col: number } {
  for (let r = 0; r < maxRows - rowSpan + 1; r++) {
    for (let c = 0; c <= totalCols - colSpan; c++) {
      let fits = true;
      outer: for (let dr = 0; dr < rowSpan; dr++) {
        for (let dc = 0; dc < colSpan; dc++) {
          if (grid[r + dr][c + dc]) {
            fits = false;
            break outer;
          }
        }
      }
      if (fits) return { row: r, col: c };
    }
  }
  // Fallback: append at the end
  return { row: maxRows, col: 0 };
}

/**
 * Parse a hex color string (#rgb, #rrggbb) into [r, g, b] in the 0–255 range.
 * Returns null if the string is not a recognisable hex color.
 */
function parseHexColor(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r, g, b];
  }
  return null;
}

/**
 * Compute the WCAG relative luminance of an sRGB triplet (values 0–255).
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Return true when a hex color string represents a dark colour
 * (relative luminance below 0.5).
 */
function isDarkColor(hex: string): boolean {
  const rgb = parseHexColor(hex);
  if (!rgb) return false;
  return relativeLuminance(rgb[0], rgb[1], rgb[2]) < 0.5;
}

/**
 * Resolve background styles for cover/section/end layouts.
 */
function resolveBackgroundStyle(slide: Slide): string | undefined {
  const { background, overlay, color } = slide.options;
  const styles: string[] = [];

  if (background) {
    const bg = String(background);
    if (bg.startsWith('http') || bg.startsWith('/') || bg.startsWith('.')) {
      styles.push(`background-image:url('${bg}')`);
      styles.push('background-size:cover');
      styles.push('background-position:center');
    } else {
      styles.push(`background:${bg}`);
      // Auto-set light text when the background is a dark solid color and no
      // explicit text color has been provided by the author.
      if (!color && bg.includes('#') && isDarkColor(bg.trim())) {
        styles.push('color:#f8fafc');
      }
    }
  }

  if (color) {
    styles.push(`color:${color}`);
  }

  return styles.length > 0 ? styles.join(';') : undefined;
}

/**
 * Fill each slot in the layout with rendered module HTML.
 */
function resolveSlots(
  layout: LayoutDefinition,
  slide: Slide,
  config: GlobalConfig,
  context: RenderContext,
): ResolvedSlot[] {
  return layout.slots.map((slot) => {
    const html = renderModuleForSlot(slot, layout, slide, config, context);
    return { slot, html };
  });
}

/**
 * Render the appropriate module for a given slot.
 */
function renderModuleForSlot(
  slot: Slot,
  layout: LayoutDefinition,
  slide: Slide,
  config: GlobalConfig,
  context: RenderContext,
): string {
  switch (slot.module) {
    case 'heading':
      return modules.renderHeading(slide, config);

    case 'richtext':
      return modules.renderRichtext(slot, slide, config);

    case 'hero':
      return modules.renderHero(slide, layout, config);

    case 'card-grid':
      return modules.renderCardGrid(slide, config);

    case 'stat-grid':
      return modules.renderStatGrid(slide, config);

    case 'chart':
      return modules.renderChart(slide, config);

    case 'table':
      return modules.renderTable(slide, config);

    case 'quote':
      return modules.renderQuote(slide, config);

    case 'image':
      return modules.renderImage(slot, slide, config);

    case 'code':
      return modules.renderCode(slide, config);

    case 'timeline':
      return modules.renderTimeline(slide, config);

    case 'comparison':
      return modules.renderComparison(slide, config);

    case 'raw':
      return modules.renderBentoCell(slot, slide, config);

    default:
      return modules.renderRichtext(slot, slide, config);
  }
}
