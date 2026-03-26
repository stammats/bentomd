import type { Slide, GlobalConfig, ChartDataItem } from '../types/index.js';
import { escapeHtml } from './utils.js';

const DEFAULT_COLORS = ['#334155', '#64748b', '#94a3b8', '#475569', '#1e293b', '#cbd5e1'];

export function renderChart(slide: Slide, _config: GlobalConfig): string {
  const items = (slide.items ?? slide.rawItems ?? []) as ChartDataItem[];
  const chartType = String(slide.options.type ?? 'bar');
  const title = slide.options.title as string | undefined;
  const colors = (slide.options.colors as string[]) ?? DEFAULT_COLORS;

  let chartSvg: string;
  switch (chartType) {
    case 'pie':
    case 'donut':
      chartSvg = renderPieChart(items, colors);
      break;
    case 'line':
    case 'area':
      chartSvg = renderLineChart(items, colors);
      break;
    default:
      chartSvg = renderBarChart(items, colors);
  }

  const titleHtml = title ? `<div class="chart-title">${escapeHtml(title)}</div>` : '';

  return (
    `<div class="module-chart" style="width:100%;height:100%;display:flex;flex-direction:column">` +
    titleHtml +
    `<div style="flex:1;min-height:0">${chartSvg}</div>` +
    `</div>`
  );
}

export function renderBarChart(items: ChartDataItem[], colors: string[]): string {
  const maxVal = Math.max(...items.map((d) => d.value), 1);
  const barHeight = 40;
  const barGap = 20;
  const labelWidth = 160;
  const valueWidth = 80;
  const chartWidth = 800;
  const barAreaWidth = chartWidth - labelWidth - valueWidth;
  const svgHeight = items.length * (barHeight + barGap) + barGap;

  const bars = items
    .map((item, i) => {
      const y = barGap + i * (barHeight + barGap);
      const w = Math.max((item.value / maxVal) * barAreaWidth, 2);
      const color = item.color ?? colors[i % colors.length];
      return (
        `<text x="${labelWidth - 12}" y="${y + barHeight / 2 + 5}" text-anchor="end" ` +
        `font-size="14" fill="currentColor">${escapeHtml(item.label)}</text>` +
        `<rect x="${labelWidth}" y="${y}" width="${w}" height="${barHeight}" rx="4" fill="${color}" />` +
        `<text x="${labelWidth + w + 8}" y="${y + barHeight / 2 + 5}" font-size="13" opacity="0.6">${item.value}</text>`
      );
    })
    .join('\n');

  return `<svg class="chart-svg" viewBox="0 0 ${chartWidth} ${svgHeight}" style="width:100%;height:100%" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}

export function renderPieChart(items: ChartDataItem[], colors: string[]): string {
  const total = items.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 160;
  const cy = 160;
  const r = 120;
  const innerR = r * 0.4;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const segments = items
    .map((item, i) => {
      const fraction = item.value / total;
      const dash = fraction * circumference;
      const color = item.color ?? colors[i % colors.length];
      const seg =
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" ` +
        `stroke-width="${r - innerR}" stroke-dasharray="${dash} ${circumference - dash}" ` +
        `stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" />`;
      offset += dash;
      return seg;
    })
    .join('\n');

  const center = `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="var(--color-background, #fff)" />`;

  const legend = items
    .map((item, i) => {
      const ly = 20 + i * 28;
      const color = item.color ?? colors[i % colors.length];
      return (
        `<rect x="350" y="${ly}" width="14" height="14" rx="3" fill="${color}" />` +
        `<text x="372" y="${ly + 12}" font-size="13" fill="currentColor">${escapeHtml(item.label)} (${item.value})</text>`
      );
    })
    .join('\n');

  const svgHeight = Math.max(320, items.length * 28 + 40);

  return (
    `<svg class="chart-svg" viewBox="0 0 560 ${svgHeight}" style="width:100%;height:100%" xmlns="http://www.w3.org/2000/svg">` +
    `${segments}${center}${legend}</svg>`
  );
}

export function renderLineChart(items: ChartDataItem[], colors: string[]): string {
  const width = 800;
  const height = 400;
  const pad = { top: 30, right: 30, bottom: 50, left: 60 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxVal = Math.max(...items.map((d) => d.value), 1);
  const color = colors[0];

  const gridLines: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i;
    const val = Math.round(maxVal * (1 - i / 4));
    gridLines.push(
      `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="currentColor" stroke-opacity="0.15" />` +
      `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" font-size="11" opacity="0.6">${val}</text>`,
    );
  }

  const points = items.map((item, i) => {
    const x = pad.left + (i / Math.max(items.length - 1, 1)) * plotW;
    const y = pad.top + plotH - (item.value / maxVal) * plotH;
    return { x, y, item };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  const areaPath =
    `M ${points[0].x},${pad.top + plotH} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x},${pad.top + plotH} Z`;

  const dots = points
    .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" />`)
    .join('\n');

  const xLabels = points
    .map(
      (p) =>
        `<text x="${p.x}" y="${height - 10}" text-anchor="middle" font-size="11" opacity="0.6">${escapeHtml(p.item.label)}</text>`,
    )
    .join('\n');

  return (
    `<svg class="chart-svg" viewBox="0 0 ${width} ${height}" style="width:100%;height:100%" xmlns="http://www.w3.org/2000/svg">` +
    gridLines.join('\n') +
    `<path d="${areaPath}" fill="${color}" opacity="0.1" />` +
    `<polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />` +
    dots +
    xLabels +
    `</svg>`
  );
}
