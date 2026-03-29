// ============================================================
// Grid Engine Type Definitions
// ============================================================

/**
 * Chrome level — controls header/footer visibility.
 * - 'full': header + footer
 * - 'minimal': footer only
 * - 'none': no chrome (cover, section, etc.)
 */
export type ChromeLevel = 'full' | 'minimal' | 'none';

/**
 * Module type — what kind of content fills a slot.
 */
export type ModuleType =
  | 'heading'
  | 'richtext'
  | 'hero'
  | 'card-grid'
  | 'stat-grid'
  | 'chart'
  | 'table'
  | 'quote'
  | 'image'
  | 'code'
  | 'timeline'
  | 'comparison'
  | 'team'
  | 'icon-list'
  | 'process'
  | 'raw';

/**
 * A slot is a named region on the grid that holds one module.
 */
export interface Slot {
  /** Unique id for this slot within the layout */
  id: string;
  /** Grid row start (1-based). 'auto' for auto-placement. */
  row: number | 'auto';
  /** Grid column start (1-based, 12-column grid) */
  col: number;
  /** Number of columns this slot spans (1-12) */
  colSpan: number;
  /** Number of rows this slot spans (default: 1) */
  rowSpan?: number;
  /** Total grid rows (for pixel ratio calculation) */
  gridRows?: number;
  /** The module type that fills this slot */
  module: ModuleType;
  /** Vertical alignment within the slot */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Horizontal alignment within the slot */
  justify?: 'start' | 'center' | 'end' | 'stretch';
}

/**
 * A layout definition is a pure data description of how to arrange
 * content on the slide grid. No CSS, no HTML — just placement rules.
 */
export interface LayoutDefinition {
  /** Layout name (matches LayoutName type) */
  name: string;
  /** Chrome level */
  chrome: ChromeLevel;
  /** CSS grid-template-rows for the content area */
  rows: string;
  /** CSS grid-template-columns override (default: repeat(12, 1fr)) */
  cols?: string;
  /** Gap between grid cells */
  gap: { row: number; col: number };
  /** Slot definitions */
  slots: Slot[];
  /** CSS place-content value for the grid container */
  placeContent?: string;
  /** CSS place-items value for the grid container */
  placeItems?: string;
  /** Whether the layout uses full-bleed (no safe-area padding) */
  fullBleed?: boolean;
}

/**
 * Resolved slot — a slot with its content already assigned.
 * This is what the grid engine receives to generate HTML.
 */
export interface ResolvedSlot {
  slot: Slot;
  /** The rendered HTML content for this slot */
  html: string;
}

/**
 * Grid render options passed to the grid engine.
 */
export interface GridRenderOptions {
  layout: LayoutDefinition;
  slots: ResolvedSlot[];
  /** Extra inline styles on the grid container */
  containerStyle?: string;
  /** Extra CSS classes on the grid container */
  containerClass?: string;
  /** Slide-level options (for per-slide chrome overrides like pageNumber) */
  slideOptions?: Record<string, unknown>;
}
