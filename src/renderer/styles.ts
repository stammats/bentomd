import { GlobalConfig, CANVAS_SIZES } from '../types/index.js';
import { generateGridCSS } from '../engine/grid.js';

export function generateCSS(config: GlobalConfig): string {
  const p = config.palette ?? {};
  const primary = p.primary ?? '#334155';
  const secondary = p.secondary ?? '#475569';
  const background = p.background ?? '#ffffff';
  const surface = p.surface ?? '#f1f5f9';
  const text = p.text ?? '#0f172a';
  const muted = p.muted ?? '#64748b';

  const fontHeading = config.fonts?.heading ?? config.fonts?.sans ?? 'Inter, system-ui, sans-serif';
  const fontBody = config.fonts?.body ?? config.fonts?.sans ?? 'Inter, system-ui, sans-serif';
  const fontMono = config.fonts?.mono ?? 'JetBrains Mono, monospace';

  const ar = config.aspectRatio ?? '16:9';
  const canvas = CANVAS_SIZES[ar] ?? CANVAS_SIZES['16:9'];
  const W = canvas.width;
  const H = canvas.height;

  // Margins
  const mH = ar === '4:3' ? 56 : 80;
  const mV = ar === '4:3' ? 48 : 64;

  // Typography — Swiss Typographic Scale (presentation-grade)
  const is43 = ar === '4:3';
  const fontDisplay = is43 ? 72 : 96;
  const fontH1 = is43 ? 52 : 64;
  const fontH2 = is43 ? 38 : 44;
  const fontH3 = is43 ? 28 : 34;
  const fontH4 = is43 ? 24 : 28;
  const fontBodySize = is43 ? 22 : 28;
  const fontBase = is43 ? 20 : 22;
  const fontSmall = is43 ? 16 : 18;
  const fontCaption = is43 ? 14 : 16;

  // Spacing — generous Swiss grid spacing
  const gutter = is43 ? 20 : 28;
  const spSm = 8;
  const spMd = 16;
  const spLg = is43 ? 20 : 28;
  const spXl = is43 ? 28 : 40;

  // Zones
  const headerH = is43 ? 40 : 48;
  const footerH = is43 ? 48 : 56;

  // Radii
  const rSm = 4;
  const rMd = 8;
  const rLg = 12;
  const rXl = is43 ? 12 : 16;

  // Grid engine CSS (replaces ~400 lines of layout-specific CSS)
  const gridCSS = generateGridCSS();

  return `
/* ==========================================================
   bentomd v0.2 — Grid Engine Rendering
   Canvas: ${W}×${H}px | Aspect: ${ar}
   ========================================================== */

:root {
  --canvas-width: ${W};
  --canvas-height: ${H};
  --margin-h: ${mH}px;
  --margin-v: ${mV}px;
  --grid-gutter: ${gutter}px;
  --color-primary: ${primary};
  --color-secondary: ${secondary};
  --color-background: ${background};
  --color-surface: ${surface};
  --color-text: ${text};
  --color-muted: ${muted};
}

html, body, div, section, article, aside, header, footer, nav, main,
h1, h2, h3, h4, h5, h6, p, blockquote, pre, ul, ol, li,
figure, figcaption, dl, dd, table, th, td, img, svg, iframe {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* --- Viewport --- */
html, body {
  margin: 0; padding: 0; overflow: hidden;
  width: 100vw; height: 100vh;
  background: #000;
}
body {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* --- Canvas --- */
.slide-deck {
  width: ${W}px;
  height: ${H}px;
  position: relative;
  overflow: hidden;
  transform: scale(var(--scale, 1));
  transform-origin: center center;
  flex-shrink: 0;
}

/* --- Slide --- */
.slide {
  position: absolute;
  inset: 0;
  width: ${W}px;
  height: ${H}px;
  display: none;
  overflow: hidden;
  background: ${background};
  color: ${text};
  font-family: ${fontBody};
  font-size: ${fontBase}px;
  line-height: 1.6;
}
.slide.active {
  display: block;
}

/* ==========================================================
   Grid Engine (unified layout system)
   ========================================================== */

${gridCSS}

/* ==========================================================
   Chrome: Header & Footer
   ========================================================== */

.slide-header {
  height: ${headerH}px;
  font-size: ${fontSmall}px;
  color: ${muted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.slide-header:empty { display: none; height: 0; }

.slide-footer {
  height: ${footerH}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${fontCaption}px;
  color: ${muted};
  border-top: 1px solid rgba(100,116,139,0.15);
  padding-top: 12px;
  flex-shrink: 0;
}
.slide-footer:empty { display: none; height: 0; }
.footer-left, .footer-center, .footer-right { flex: 1; }
.footer-center { text-align: center; }
.footer-right { text-align: right; }

.slide-logo { display: block; }

/* ==========================================================
   Typography
   ========================================================== */

/* Scoped to slide content — excludes mermaid internals */
.slide-content h1 { font-size: ${fontH1}px; font-weight: 700; line-height: 1.15; font-family: ${fontHeading}; }
.slide-content h2 { font-size: ${fontH2}px; font-weight: 600; line-height: 1.2; font-family: ${fontHeading}; }
.slide-content h3 { font-size: ${fontH3}px; font-weight: 600; line-height: 1.3; font-family: ${fontHeading}; }
.slide-content h4 { font-size: ${fontH4}px; font-weight: 500; line-height: 1.3; font-family: ${fontHeading}; }
.slide-content .module-richtext > p,
.slide-content .module-richtext > ul p,
.slide-content .module-richtext > ol p,
.slide-content .module-heading p,
.slide-content .slide-summary { font-size: ${fontBodySize}px; line-height: 1.6; }
.slide-content ul, .slide-content ol { font-size: ${fontBodySize}px; line-height: 1.6; padding-left: 1.5em; }
.slide-content li { margin-bottom: 0.5em; }
.slide-content a:not(.mermaid a) { color: ${primary}; text-decoration: none; }
.slide-content a:not(.mermaid a):hover { text-decoration: underline; }
.slide-content strong:not(.mermaid strong) { font-weight: 700; }
.slide-content em:not(.mermaid em) { font-style: italic; }

.slide-content code:not(.mermaid code) {
  font-family: ${fontMono};
  background: ${surface};
  padding: 2px 6px;
  border-radius: ${rSm}px;
  font-size: 0.9em;
}
.slide-content pre:not(.mermaid) {
  background: ${surface};
  padding: ${spLg}px;
  border-radius: ${rLg}px;
  overflow-x: auto;
  margin: 16px 0;
  line-height: 1.5;
}
.slide-content pre:not(.mermaid) code {
  background: none;
  padding: 0;
  font-size: ${fontSmall}px;
}
.slide-content blockquote {
  border-left: 4px solid ${primary};
  padding-left: ${spLg}px;
  font-style: italic;
  color: ${muted};
  margin: 16px 0;
}
.slide-content table {
  width: 100%;
  border-collapse: collapse;
  font-size: ${fontBodySize}px;
}
.slide-content th {
  text-align: left;
  font-weight: 600;
  padding: ${spSm}px ${spMd}px;
  border-bottom: 2px solid rgba(100,116,139,0.25);
}
.slide-content td {
  padding: ${spSm}px ${spMd}px;
  border-bottom: 1px solid rgba(100,116,139,0.12);
}

tr:last-child td { border-bottom: none; }

/* ==========================================================
   Module: Heading
   ========================================================== */

.module-heading { margin-bottom: 0; }
.module-heading h1 {
  font-size: ${fontH1}px;
  font-weight: 800;
  line-height: 1.1;
  font-family: ${fontHeading};
  color: ${text};
  letter-spacing: -0.02em;
}
.slide-summary {
  font-size: ${fontH4}px;
  color: ${muted};
  line-height: 1.4;
  margin-top: 12px;
}

/* ==========================================================
   Module: Hero (cover/section/end)
   ========================================================== */

.module-hero {
  width: 100%;
  text-align: center;
}
.module-hero h1 {
  font-size: ${fontDisplay}px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: ${spLg}px;
  letter-spacing: -0.03em;
}
.module-hero h2 {
  font-size: ${fontH2}px;
  font-weight: 400;
  line-height: 1.3;
  opacity: 0.7;
  margin-bottom: ${spXl}px;
}
.module-hero p {
  font-size: ${fontBodySize}px;
  opacity: 0.6;
  margin-top: ${spXl}px;
}

.hero-align-center { text-align: center; }
.hero-align-left { text-align: left; }
.hero-align-bottom-left {
  text-align: left;
  align-self: flex-end;
  justify-self: flex-start;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* ==========================================================
   Module: Card Grid (features)
   ========================================================== */

.features-grid {
  display: grid;
  align-content: center;
  height: 100%;
}

.feature-card {
  background: ${surface};
  border-radius: ${rXl}px;
  padding: ${spXl}px ${spXl}px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 180px;
}
.feature-card.feature-style-minimal {
  background: transparent;
  border-left: 3px solid ${primary};
  border-radius: 0;
  padding-left: ${spLg}px;
}
.feature-card.feature-style-icon-top {
  text-align: center;
  align-items: center;
}
.feature-icon {
  color: ${primary};
  margin-bottom: ${spLg}px;
  width: 48px;
  height: 48px;
}
.feature-icon svg { width: 100%; height: 100%; }
.feature-title {
  font-size: ${fontH3}px;
  font-weight: 700;
  margin-bottom: ${spSm}px;
  line-height: 1.25;
  letter-spacing: -0.01em;
}
.feature-desc {
  font-size: ${fontBase}px;
  color: ${muted};
  line-height: 1.55;
}

/* ==========================================================
   Module: Stat Grid
   ========================================================== */

.stats-grid {
  display: grid;
  align-content: center;
  height: 100%;
}

.stat-card {
  text-align: center;
  padding: ${spXl}px;
}
.stat-icon {
  color: ${primary};
  margin-bottom: ${spLg}px;
  display: flex;
  justify-content: center;
}
.stat-icon svg { width: 40px; height: 40px; }
.stat-value {
  font-size: ${fontDisplay}px;
  font-weight: 800;
  line-height: 1;
  color: ${primary};
  margin-bottom: ${spMd}px;
  font-family: ${fontHeading};
  letter-spacing: -0.02em;
}
.stat-label {
  font-size: ${fontBase}px;
  color: ${muted};
  font-weight: 400;
  line-height: 1.4;
}
.stat-trend {
  font-size: ${fontSmall}px;
  margin-top: ${spSm}px;
  color: ${muted};
  font-weight: 500;
}

/* ==========================================================
   Module: Chart
   ========================================================== */

.chart-title {
  font-size: ${fontH3}px;
  font-weight: 600;
  margin-bottom: ${spLg}px;
}
.chart-svg { width: 100%; height: 100%; }

/* ==========================================================
   Module: Table
   ========================================================== */

.slide-table th {
  background: ${surface};
  font-size: ${fontSmall}px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: ${spMd}px ${spLg}px;
  font-weight: 700;
}
.slide-table td {
  font-size: ${fontBodySize}px;
  padding: ${spMd}px ${spLg}px;
}
.slide-table tr:nth-child(even) td {
  background: rgba(${hexToRgb(surface)}, 0.5);
}
.table-caption {
  font-size: ${fontSmall}px;
  color: ${muted};
  margin-top: ${spMd}px;
  text-align: center;
}

/* ==========================================================
   Module: Quote
   ========================================================== */

.module-quote {
  text-align: center;
  max-width: 75%;
  margin: 0 auto;
}
.quote-text {
  font-size: ${fontH2 + 4}px;
  font-weight: 400;
  line-height: 1.45;
  font-style: italic;
  border: none;
  padding: 0;
  margin: 0;
  color: ${text};
  position: relative;
}
.quote-text::before {
  content: "\\201C";
  font-size: 180px;
  color: ${primary};
  opacity: 0.15;
  position: absolute;
  top: -60px;
  left: -50px;
  line-height: 1;
  font-style: normal;
  font-weight: 700;
}
.quote-attribution {
  margin-top: ${spXl + 8}px;
  font-size: ${fontBodySize}px;
  color: ${muted};
}
.quote-author {
  font-weight: 700;
  color: ${text};
}
.quote-role {
  margin-left: 8px;
}

/* ==========================================================
   Module: Code
   ========================================================== */

.code-title {
  font-size: ${fontSmall}px;
  font-weight: 500;
  color: ${muted};
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.code-lang {
  font-size: ${fontSmall}px;
  color: ${muted};
  background: ${surface};
  padding: 2px 8px;
  border-radius: ${rSm}px;
}

/* ==========================================================
   Module: Timeline
   ========================================================== */

.module-timeline {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  padding-left: ${spXl + 16}px;
}
.module-timeline::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: rgba(100,116,139,0.2);
  border-radius: 2px;
}
.timeline-item {
  position: relative;
  padding-left: ${spXl}px;
  padding-bottom: ${spXl + 8}px;
}
.timeline-item::before {
  content: "";
  position: absolute;
  left: ${-spXl - 12}px;
  top: 8px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: ${muted};
  border: 3px solid ${background};
}
.timeline-item.active::before {
  background: ${primary};
  box-shadow: 0 0 0 5px rgba(37,99,235,0.15);
  border-color: ${background};
}
.timeline-date {
  font-size: ${fontSmall}px;
  color: ${primary};
  font-weight: 600;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.timeline-item h3 {
  font-size: ${fontH3}px;
  font-weight: 700;
  margin-bottom: 6px;
}
.timeline-item p {
  font-size: ${fontBase}px;
  color: ${muted};
  line-height: 1.55;
}

/* ==========================================================
   Module: Comparison
   ========================================================== */

.comparison-card {
  background: ${surface};
  border-radius: ${rXl}px;
  padding: ${spXl + 8}px ${spXl}px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.comparison-card.highlight {
  border: 2px solid ${primary};
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}
.comparison-label {
  font-size: ${fontSmall}px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${muted};
  margin-bottom: ${spSm}px;
}
.comparison-price {
  font-size: ${fontH1}px;
  font-weight: 800;
  color: ${primary};
  margin-bottom: ${spLg}px;
  letter-spacing: -0.02em;
}
.comparison-features {
  list-style: none;
  padding: 0;
}
.comparison-features li {
  font-size: ${fontBase}px;
  padding: ${spSm}px 0;
  border-bottom: 1px solid rgba(100,116,139,0.12);
}
.comparison-features li:last-child { border-bottom: none; }

/* ==========================================================
   Module: Bento Cell
   ========================================================== */

.slide-content[data-layout="bento"] {
  background: ${background};
  padding: ${mV}px ${mH}px;
}
.slide-content[data-layout="bento"] .slide-grid {
  gap: ${gutter}px;
  height: 100%;
}

.bento-cell {
  background: ${surface};
  transition: transform 0.15s ease;
}
.bento-value {
  font-size: ${fontDisplay + 8}px;
  font-weight: 800;
  color: ${primary};
  font-family: ${fontHeading};
  letter-spacing: -0.03em;
}
.bento-title {
  font-size: ${fontH3 + 2}px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.bento-label {
  font-size: ${fontBase}px;
  color: ${muted};
  margin-top: 4px;
}
.bento-desc {
  font-size: ${fontBase}px;
  color: ${muted};
  line-height: 1.5;
  margin-top: 8px;
}
.bento-icon {
  color: ${primary};
  margin-bottom: ${spLg}px;
}
.bento-icon svg { width: 44px; height: 44px; }
.bento-content { margin-top: ${spSm}px; }

/* Bento inline image (content image, not background) */
.bento-inline-image {
  flex: 1;
  min-height: 0;
  margin-top: ${spMd}px;
  border-radius: ${rMd}px;
  overflow: hidden;
}
.bento-inline-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Bento image cell */
.bento-cell-image {
  background: #000;
}
.bento-image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: ${spLg}px ${spXl}px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: #fff;
}
.bento-image-overlay .bento-title {
  color: #fff;
  font-size: ${fontH4}px;
}
.bento-image-overlay .bento-desc {
  color: rgba(255,255,255,0.8);
  font-size: ${fontSmall}px;
}

/* ==========================================================
   Module: Image
   ========================================================== */

.image-caption {
  font-size: ${fontSmall}px;
  color: ${muted};
  text-align: center;
  margin-top: ${spMd}px;
}

/* ==========================================================
   Module: Mermaid Diagrams
   ========================================================== */

pre.mermaid, .mermaid-wrapper {
  background: transparent;
  padding: 0;
  margin: auto 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  width: 100%;
}

/* Richtext containing mermaid or charts — fill body area, center content */
.module-richtext:has(.mermaid-wrapper),
.module-richtext:has(.inline-chart) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* Inline chart fills available space */
.inline-chart {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.inline-chart svg {
  width: 100%;
  height: 100%;
}

/* Chart layout module */
.module-chart {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  min-height: 0;
}

/* ==========================================================
   Content Scale Levels (overflow prevention)
   ========================================================== */

.content-scale-1 h1 { font-size: ${Math.round(fontH1 * 0.85)}px; }
.content-scale-1 h2 { font-size: ${Math.round(fontH2 * 0.85)}px; }
.content-scale-1 h3, .content-scale-1 .feature-title { font-size: ${Math.round(fontH3 * 0.85)}px; }
.content-scale-1 p, .content-scale-1 li, .content-scale-1 .feature-desc, .content-scale-1 td { font-size: ${Math.round(fontBodySize * 0.9)}px; line-height: 1.5; }
.content-scale-1 .stat-value { font-size: ${Math.round(fontDisplay * 0.85)}px; }
.content-scale-1 .slide-summary { font-size: ${Math.round(fontH4 * 0.85)}px; }
.content-scale-1 .module-heading h1 { font-size: ${Math.round(fontH1 * 0.85)}px; }

.content-scale-2 h1 { font-size: ${Math.round(fontH1 * 0.72)}px; }
.content-scale-2 h2 { font-size: ${Math.round(fontH2 * 0.72)}px; }
.content-scale-2 h3, .content-scale-2 .feature-title { font-size: ${Math.round(fontH3 * 0.75)}px; }
.content-scale-2 p, .content-scale-2 li, .content-scale-2 .feature-desc, .content-scale-2 td { font-size: ${Math.round(fontBodySize * 0.8)}px; line-height: 1.45; }
.content-scale-2 .stat-value { font-size: ${Math.round(fontDisplay * 0.72)}px; }
.content-scale-2 .slide-summary { font-size: ${Math.round(fontH4 * 0.75)}px; }
.content-scale-2 .module-heading h1 { font-size: ${Math.round(fontH1 * 0.72)}px; }

.content-scale-3 h1 { font-size: ${Math.round(fontH1 * 0.64)}px; }
.content-scale-3 h2 { font-size: ${Math.round(fontH2 * 0.64)}px; }
.content-scale-3 h3, .content-scale-3 .feature-title { font-size: ${Math.round(fontH3 * 0.67)}px; }
.content-scale-3 p, .content-scale-3 li, .content-scale-3 .feature-desc, .content-scale-3 td { font-size: ${Math.round(fontBodySize * 0.75)}px; line-height: 1.35; }
.content-scale-3 .stat-value { font-size: ${Math.round(fontDisplay * 0.64)}px; }
.content-scale-3 .slide-summary { font-size: ${Math.round(fontH4 * 0.67)}px; }
.content-scale-3 .module-heading h1 { font-size: ${Math.round(fontH1 * 0.64)}px; }

.content-scale-4 h1 { font-size: ${Math.round(fontH1 * 0.57)}px; }
.content-scale-4 h2 { font-size: ${Math.round(fontH2 * 0.57)}px; }
.content-scale-4 h3, .content-scale-4 .feature-title { font-size: ${Math.round(fontH3 * 0.6)}px; }
.content-scale-4 p, .content-scale-4 li, .content-scale-4 .feature-desc, .content-scale-4 td { font-size: ${Math.round(fontBodySize * 0.7)}px; line-height: 1.3; }
.content-scale-4 .stat-value { font-size: ${Math.round(fontDisplay * 0.57)}px; }
.content-scale-4 .slide-summary { font-size: ${Math.round(fontH4 * 0.6)}px; }
.content-scale-4 .module-heading h1 { font-size: ${Math.round(fontH1 * 0.57)}px; }

/* ==========================================================
   Utility
   ========================================================== */

.text-primary { color: ${primary}; }
.text-muted { color: ${muted}; }
.text-center { text-align: center; }

/* ==========================================================
   Debug Grid Overlay (Material Design palette)
   MD Blue 500: #2196F3   MD Purple 500: #9C27B0
   MD Teal 500: #009688   MD Amber 500: #FFC107
   MD Pink 500: #E91E63   MD Green 500: #4CAF50
   ========================================================== */

.slide-deck.debug-grid .slide-content {
  outline: 2px solid rgba(33,150,243,0.4);
}

/* --- Header zone (MD Blue) --- */
.slide-deck.debug-grid .slide-header {
  background: rgba(33,150,243,0.08);
  border: 1px solid rgba(33,150,243,0.35);
  position: relative;
}
.slide-deck.debug-grid .slide-header::after {
  content: "HEADER";
  position: absolute;
  top: 2px;
  right: 6px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: rgba(33,150,243,0.7);
  font-family: monospace;
  pointer-events: none;
}

/* --- Heading slot (MD Purple) --- */
.slide-deck.debug-grid .slot-heading {
  background: rgba(156,39,176,0.06) !important;
  border: 1px solid rgba(156,39,176,0.3) !important;
}

/* --- Body zone (MD Teal) --- */
.slide-deck.debug-grid .slide-body {
  background: rgba(0,150,136,0.05);
  border: 1px solid rgba(0,150,136,0.3);
}
.slide-deck.debug-grid .slide-body::before {
  content: "BODY";
  position: absolute;
  top: 2px;
  right: 6px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: rgba(0,150,136,0.6);
  font-family: monospace;
  z-index: 100;
  pointer-events: none;
}

/* --- Footer zone (MD Blue) --- */
.slide-deck.debug-grid .slide-footer {
  background: rgba(33,150,243,0.08);
  border: 1px solid rgba(33,150,243,0.35);
  position: relative;
}
.slide-deck.debug-grid .slide-footer::before {
  content: "FOOTER";
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: rgba(33,150,243,0.7);
  font-family: monospace;
  pointer-events: none;
}

/* --- Grid container (MD Amber) --- */
.slide-deck.debug-grid .slide-grid {
  border: 1px solid rgba(255,193,7,0.4);
}

/* --- Slots (MD Amber) --- */
.slide-deck.debug-grid .slot {
  border: 1px dashed rgba(255,193,7,0.5);
  background: rgba(255,193,7,0.04);
  position: relative;
}
.slide-deck.debug-grid .slot::after {
  content: attr(data-module);
  position: absolute;
  top: 2px;
  left: 6px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: rgba(255,193,7,0.7);
  font-family: monospace;
  pointer-events: none;
  z-index: 100;
  text-transform: uppercase;
}

/* --- Inner module grids (MD Pink) --- */
.slide-deck.debug-grid .module-card-grid,
.slide-deck.debug-grid .module-stat-grid {
  border: 1px dotted rgba(233,30,99,0.35);
}

.slide-deck.debug-grid .feature-card,
.slide-deck.debug-grid .stat-card {
  border: 1px solid rgba(233,30,99,0.25);
}

/* --- Module: timeline items (MD Green) --- */
.slide-deck.debug-grid .timeline-item {
  border: 1px dashed rgba(76,175,80,0.3);
}

/* --- Module: table (MD Green) --- */
.slide-deck.debug-grid .slide-table {
  border: 1px solid rgba(76,175,80,0.3);
}

/* --- Module: quote (MD Purple) --- */
.slide-deck.debug-grid .module-quote {
  border: 1px dashed rgba(156,39,176,0.3);
}

/* --- Module: chart (MD Amber) --- */
.slide-deck.debug-grid .module-chart {
  border: 1px dashed rgba(255,193,7,0.35);
}

/* --- Module: bento cells (MD Deep Orange) --- */
.slide-deck.debug-grid .bento-cell {
  border: 1px solid rgba(255,87,34,0.35);
}

/* ==========================================================
   Print (PDF export support)
   ========================================================== */

@media print {
  html, body { background: white; overflow: visible; }
  .slide-deck { transform: none !important; }
  .slide {
    display: block !important;
    position: relative !important;
    page-break-after: always;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .slide:last-child { page-break-after: auto; }
  @page {
    size: ${W}px ${H}px;
    margin: 0;
  }
}
`.trim();
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return isNaN(r) ? '248,250,252' : `${r},${g},${b}`;
}
