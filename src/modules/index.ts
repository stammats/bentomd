// ============================================================
// Module Renderers — Atomic content units that fill slots
//
// Each module renders HTML for its content type.
// Modules are size-agnostic: the parent slot controls dimensions.
// ============================================================

export { renderHeading } from './heading.js';
export { renderRichtext } from './richtext.js';
export { renderHero } from './hero.js';
export { renderCardGrid } from './card-grid.js';
export { renderStatGrid } from './stat-grid.js';
export { renderChart } from './chart.js';
export { renderTable } from './table.js';
export { renderQuote } from './quote.js';
export { renderImage } from './image.js';
export { renderCode } from './code.js';
export { renderTimeline } from './timeline.js';
export { renderComparison } from './comparison.js';
export { renderBentoCell } from './bento-cell.js';
