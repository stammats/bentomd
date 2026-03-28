// ============================================================
// Layout Definitions — Pure data, no CSS, no HTML
// ============================================================

import type { LayoutDefinition } from './types.js';

// --------------------------------------------------
// Opening & Structural
// --------------------------------------------------

export const coverLayout: LayoutDefinition = {
  name: 'cover',
  chrome: 'none',
  rows: '1fr',
  gap: { row: 0, col: 0 },
  slots: [
    { id: 'hero', row: 1, col: 1, colSpan: 12, module: 'hero', align: 'center', justify: 'center' },
  ],
  placeContent: 'center',
  fullBleed: true,
};

export const sectionLayout: LayoutDefinition = {
  name: 'section',
  chrome: 'none',
  rows: '1fr',
  gap: { row: 0, col: 0 },
  slots: [
    { id: 'hero', row: 1, col: 1, colSpan: 12, module: 'hero', align: 'center', justify: 'center' },
  ],
  placeContent: 'center',
};

export const endLayout: LayoutDefinition = {
  name: 'end',
  chrome: 'none',
  rows: '1fr',
  gap: { row: 0, col: 0 },
  slots: [
    { id: 'hero', row: 1, col: 1, colSpan: 12, module: 'hero', align: 'center', justify: 'center' },
  ],
  placeContent: 'center',
};

export const blankLayout: LayoutDefinition = {
  name: 'blank',
  chrome: 'none',
  rows: '1fr',
  gap: { row: 0, col: 0 },
  slots: [],
};

// --------------------------------------------------
// Content Layouts
// --------------------------------------------------

export const defaultLayout: LayoutDefinition = {
  name: 'default',
  chrome: 'full',
  rows: 'auto 1fr',
  gap: { row: 32, col: 24 },
  slots: [
    { id: 'heading', row: 1, col: 1, colSpan: 12, module: 'heading' },
    { id: 'body', row: 2, col: 1, colSpan: 12, module: 'richtext' },
  ],
};

export const twoColumnLayout: LayoutDefinition = {
  name: 'two-column',
  chrome: 'full',
  rows: 'auto 1fr',
  gap: { row: 32, col: 48 },
  slots: [
    { id: 'heading', row: 1, col: 1, colSpan: 12, module: 'heading' },
    { id: 'left', row: 2, col: 1, colSpan: 6, module: 'richtext' },
    { id: 'right', row: 2, col: 7, colSpan: 6, module: 'richtext' },
  ],
};

export const threeColumnLayout: LayoutDefinition = {
  name: 'three-column',
  chrome: 'full',
  rows: 'auto 1fr',
  gap: { row: 32, col: 24 },
  slots: [
    { id: 'heading', row: 1, col: 1, colSpan: 12, module: 'heading' },
    { id: 'col1', row: 2, col: 1, colSpan: 4, module: 'richtext' },
    { id: 'col2', row: 2, col: 5, colSpan: 4, module: 'richtext' },
    { id: 'col3', row: 2, col: 9, colSpan: 4, module: 'richtext' },
  ],
};

// --------------------------------------------------
// Media Layouts
// --------------------------------------------------

export const imageFullLayout: LayoutDefinition = {
  name: 'image',
  chrome: 'full',
  rows: 'auto 1fr',
  gap: { row: 16, col: 0 },
  slots: [
    { id: 'heading', row: 1, col: 1, colSpan: 12, module: 'heading' },
    { id: 'image', row: 2, col: 1, colSpan: 12, module: 'image', align: 'stretch', justify: 'stretch' },
  ],
};

export const imageLeftLayout: LayoutDefinition = {
  name: 'image-left',
  chrome: 'full',
  rows: 'auto 1fr',
  gap: { row: 32, col: 48 },
  slots: [
    { id: 'heading', row: 1, col: 1, colSpan: 12, module: 'heading' },
    { id: 'image', row: 2, col: 1, colSpan: 6, module: 'image', align: 'stretch' },
    { id: 'body', row: 2, col: 7, colSpan: 6, module: 'richtext', align: 'center' },
  ],
};

export const imageRightLayout: LayoutDefinition = {
  name: 'image-right',
  chrome: 'full',
  rows: 'auto 1fr',
  gap: { row: 32, col: 48 },
  slots: [
    { id: 'heading', row: 1, col: 1, colSpan: 12, module: 'heading' },
    { id: 'body', row: 2, col: 1, colSpan: 6, module: 'richtext', align: 'center' },
    { id: 'image', row: 2, col: 7, colSpan: 6, module: 'image', align: 'stretch' },
  ],
};

// --------------------------------------------------
// Data Layouts
// --------------------------------------------------

export const featuresLayout: LayoutDefinition = {
  name: 'features',
  chrome: 'full',
  rows: 'auto 1fr',
  gap: { row: 32, col: 24 },
  slots: [
    { id: 'heading', row: 1, col: 1, colSpan: 12, module: 'heading' },
    { id: 'grid', row: 2, col: 1, colSpan: 12, module: 'card-grid', align: 'center' },
  ],
};

export const statsLayout: LayoutDefinition = {
  name: 'stats',
  chrome: 'full',
  rows: 'auto 1fr',
  gap: { row: 32, col: 24 },
  slots: [
    { id: 'heading', row: 1, col: 1, colSpan: 12, module: 'heading' },
    { id: 'grid', row: 2, col: 1, colSpan: 12, module: 'stat-grid', align: 'center' },
  ],
};

export const chartLayout: LayoutDefinition = {
  name: 'chart',
  chrome: 'full',
  rows: 'auto 1fr',
  gap: { row: 32, col: 24 },
  slots: [
    { id: 'heading', row: 1, col: 1, colSpan: 12, module: 'heading' },
    { id: 'chart', row: 2, col: 1, colSpan: 12, module: 'chart', align: 'stretch' },
  ],
};

export const tableLayout: LayoutDefinition = {
  name: 'table',
  chrome: 'full',
  rows: 'auto 1fr',
  gap: { row: 32, col: 24 },
  slots: [
    { id: 'heading', row: 1, col: 1, colSpan: 12, module: 'heading' },
    { id: 'table', row: 2, col: 1, colSpan: 12, module: 'table', align: 'center' },
  ],
};

export const quoteLayout: LayoutDefinition = {
  name: 'quote',
  chrome: 'minimal',
  rows: '1fr',
  gap: { row: 0, col: 0 },
  slots: [
    { id: 'quote', row: 1, col: 2, colSpan: 10, module: 'quote', align: 'center', justify: 'center' },
  ],
};

export const codeLayout: LayoutDefinition = {
  name: 'code',
  chrome: 'full',
  rows: 'auto 1fr',
  gap: { row: 24, col: 24 },
  slots: [
    { id: 'heading', row: 1, col: 1, colSpan: 12, module: 'heading' },
    { id: 'code', row: 2, col: 1, colSpan: 12, module: 'code', align: 'stretch' },
  ],
};

// --------------------------------------------------
// Comparison & Analysis
// --------------------------------------------------

export const comparisonLayout: LayoutDefinition = {
  name: 'comparison',
  chrome: 'full',
  rows: 'auto 1fr',
  gap: { row: 32, col: 24 },
  slots: [
    { id: 'heading', row: 1, col: 1, colSpan: 12, module: 'heading' },
    { id: 'cards', row: 2, col: 1, colSpan: 12, module: 'comparison', align: 'center' },
  ],
};

export const timelineLayout: LayoutDefinition = {
  name: 'timeline',
  chrome: 'full',
  rows: 'auto 1fr',
  gap: { row: 32, col: 24 },
  slots: [
    { id: 'heading', row: 1, col: 1, colSpan: 12, module: 'heading' },
    { id: 'timeline', row: 2, col: 1, colSpan: 12, module: 'timeline', align: 'center' },
  ],
};

// --------------------------------------------------
// Bento Grid (bentomd signature layout)
// --------------------------------------------------

export const bentoLayout: LayoutDefinition = {
  name: 'bento',
  chrome: 'none',
  rows: 'repeat(3, 1fr)',
  cols: 'repeat(12, 1fr)',
  gap: { row: 16, col: 16 },
  slots: [
    // Bento slots are dynamic — resolved at runtime from items
    // The slot-resolver generates slots from BentoCell[] items
  ],
};

// --------------------------------------------------
// Registry
// --------------------------------------------------

export const layoutRegistry: Record<string, LayoutDefinition> = {
  cover: coverLayout,
  section: sectionLayout,
  end: endLayout,
  blank: blankLayout,
  default: defaultLayout,
  'two-column': twoColumnLayout,
  image: imageFullLayout,
  chart: chartLayout,
  table: tableLayout,
  quote: quoteLayout,
  code: codeLayout,
  timeline: timelineLayout,
  bento: bentoLayout,
  // Aliases → bento handles these
  features: bentoLayout,
  stats: bentoLayout,
  comparison: bentoLayout,
  'three-column': bentoLayout,
  'image-left': bentoLayout,
  'image-right': bentoLayout,
  grid: bentoLayout,
};
