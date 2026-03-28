// ============================================================
// Global Configuration
// ============================================================

export interface GlobalConfig {
  theme?: string;
  title?: string;
  author?: string;
  date?: string;
  aspectRatio?: '16:9' | '4:3';
  fonts?: FontConfig;
  palette?: Palette;
  icons?: IconConfig;
  logo?: LogoConfig;
  footer?: FooterConfig;
  lang?: string;
  dir?: 'ltr' | 'rtl';
  defaults?: SlideDefaults;
  /** Border radius for bento cells in pixels. Default: 20 */
  borderRadius?: number;
}

export interface FontConfig {
  heading?: string;
  body?: string;
  mono?: string;
  /** @deprecated Use heading/body instead */
  sans?: string;
}

export interface Palette {
  primary?: string;
  secondary?: string;
  background?: string;
  surface?: string;
  text?: string;
  muted?: string;
}

export interface IconConfig {
  strokeWidth?: number;
  size?: number;
  color?: string;
}

export interface LogoConfig {
  path?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  height?: number;
}

export interface FooterConfig {
  left?: string;
  center?: string;
  right?: string;
  show?: boolean;
}

export interface SlideDefaults {
  header?: string;
  footer?: boolean;
  pageNumber?: boolean;
  layout?: string;
}

// ============================================================
// Canvas
// ============================================================

export interface CanvasSize {
  width: number;
  height: number;
}

export const CANVAS_SIZES: Record<string, CanvasSize> = {
  '16:9': { width: 1920, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
};

// ============================================================
// Slide Definition
// ============================================================

export type LayoutName =
  | 'cover'
  | 'default'
  | 'section'
  | 'two-column'
  | 'three-column'
  | 'features'
  | 'stats'
  | 'chart'
  | 'table'
  | 'quote'
  | 'image'
  | 'image-left'
  | 'image-right'
  | 'code'
  | 'comparison'
  | 'timeline'
  | 'bento'
  | 'end';

export interface Slide {
  layout: LayoutName | string;
  options: SlideOptions;
  content: string;
  items?: ContentModule[];
  /** Raw unparsed items for backward compat */
  rawItems?: Record<string, unknown>[];
}

export interface SlideOptions {
  // Page structure elements
  header?: string;
  heading?: string;
  summary?: string;
  footer?: boolean | string;
  pageNumber?: boolean;

  // Layout options
  ratio?: string;
  columns?: number;
  valign?: 'top' | 'center' | 'bottom';
  gap?: 'sm' | 'md' | 'lg';
  background?: string;
  overlay?: number;
  align?: string;
  style?: string;
  color?: string;

  // Image options
  src?: string;
  fit?: 'cover' | 'contain' | 'auto';
  position?: string;
  caption?: string;

  // Chart options
  type?: string;
  title?: string;
  showValues?: boolean;
  showLegend?: boolean;
  colors?: string[];

  // Code options
  language?: string;
  highlight?: string;

  // Comparison
  direction?: 'horizontal' | 'vertical';

  // Catch-all
  [key: string]: unknown;
}

// ============================================================
// Content Modules (typed items)
// ============================================================

export type ContentModule =
  | TextModule
  | ChartDataItem
  | FeatureItem
  | StatItem
  | CodeModule
  | ImageModule
  | TableModule
  | QuoteModule
  | TimelineItem
  | ComparisonItem
  | GenericItem;

// Feature card
export interface FeatureItem {
  type?: 'feature';
  icon?: string;
  title: string;
  description?: string;
  link?: string;
  iconColor?: string;
  iconSize?: number;
  iconStrokeWidth?: number;
}

// Stat/KPI
export interface StatItem {
  type?: 'stat';
  value: string;
  label: string;
  icon?: string;
  trend?: string;
}

// Chart data point
export interface ChartDataItem {
  type?: 'chart-data';
  label: string;
  value: number;
  color?: string;
}

// Text module
export interface TextModule {
  type: 'text';
  content: string;
}

// Code module
export interface CodeModule {
  type: 'code';
  language?: string;
  code: string;
  title?: string;
  highlight?: string;
}

// Image module
export interface ImageModule {
  type: 'image';
  src: string;
  alt?: string;
  fit?: 'cover' | 'contain' | 'fill';
  position?: string;
}

// Table module
export interface TableModule {
  type: 'table';
  headers: string[];
  rows: string[][];
  caption?: string;
}

// Quote module
export interface QuoteModule {
  type: 'quote';
  text: string;
  author?: string;
  role?: string;
}

// Timeline item
export interface TimelineItem {
  type?: 'timeline';
  date?: string;
  title: string;
  description?: string;
  active?: boolean;
}

// Comparison item
export interface ComparisonItem {
  type?: 'comparison';
  label: string;
  price?: string;
  features?: string[];
  highlight?: boolean;
}

// Bento cell
export interface BentoCell {
  /** Size keyword: sm, md, lg, wide, tall, hero, full — or explicit "6x2" (colSpan x rowSpan) */
  size?: string;
  /** @deprecated Use size instead */
  span?: string;
  background?: string;
  /** Text/icon color — auto-derived from background for contrast */
  color?: string;
  content?: string;
  icon?: string;
  title?: string;
  description?: string;
  image?: string;
  value?: string;
  label?: string;
  align?: string;
  /** Mermaid diagram source extracted from a ```mermaid code block in the cell body */
  mermaid?: string;
}

// Generic fallback
export interface GenericItem {
  type?: string;
  [key: string]: unknown;
}

// ============================================================
// Space Budget (for overflow prevention)
// ============================================================

export interface SpaceBudget {
  canvasWidth: number;
  canvasHeight: number;
  contentWidth: number;
  contentHeight: number;
  bodyHeight: number;
  chromeHeight: number;
}

// ============================================================
// Deck
// ============================================================

export interface Deck {
  config: GlobalConfig;
  slides: Slide[];
}

// ============================================================
// Layout Renderer
// ============================================================

export type LayoutRenderer = (
  slide: Slide,
  config: GlobalConfig,
  context: RenderContext,
) => string;

export interface RenderContext {
  slideIndex: number;
  totalSlides: number;
  budget: SpaceBudget;
}
