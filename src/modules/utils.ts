import { marked } from 'marked';
import * as lucideIcons from 'lucide-static';
import { renderBarChart, renderPieChart, renderLineChart } from './chart.js';
import type { ChartDataItem } from '../types/index.js';

const DEFAULT_CHART_COLORS = ['#0984e3', '#6c5ce7', '#00b894', '#d63031', '#fdcb6e', '#e17055'];

/**
 * Parse inline chart code block.
 * Format:
 *   type: bar|pie|line
 *   Label: Value
 *   Label: Value
 */
function parseInlineChart(text: string): { type: string; items: ChartDataItem[]; colors: string[] } {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  let type = 'bar';
  let colors = DEFAULT_CHART_COLORS;
  const items: ChartDataItem[] = [];

  for (const line of lines) {
    const typeMatch = line.match(/^type:\s*(.+)/i);
    if (typeMatch) { type = typeMatch[1].trim().toLowerCase(); continue; }
    const colorsMatch = line.match(/^colors:\s*(.+)/i);
    if (colorsMatch) { colors = colorsMatch[1].split(',').map((c) => c.trim()); continue; }
    const dataMatch = line.match(/^(.+?)\s*[:]\s*([\d.]+)/);
    if (dataMatch) {
      items.push({ label: dataMatch[1].trim(), value: parseFloat(dataMatch[2]) });
    }
  }
  return { type, items, colors };
}

function renderInlineChart(text: string): string {
  const { type, items, colors } = parseInlineChart(text);
  if (items.length === 0) return `<pre><code>${text}</code></pre>`;

  let svg: string;
  switch (type) {
    case 'pie':
    case 'donut':
      svg = renderPieChart(items, colors);
      break;
    case 'line':
    case 'area':
      svg = renderLineChart(items, colors);
      break;
    default:
      svg = renderBarChart(items, colors);
  }
  return `<div class="inline-chart">${svg}</div>`;
}

marked.use({
  async: false,
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      if (lang === 'mermaid') {
        return `<pre class="mermaid">${text}</pre>`;
      }
      if (lang === 'chart') {
        return renderInlineChart(text);
      }
      const langClass = lang ? ` class="language-${lang}"` : '';
      const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<pre><code${langClass}>${escaped}</code></pre>`;
    },
  },
});

const icons = lucideIcons as unknown as Record<string, string>;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderMarkdown(md: string): string {
  return marked.parse(md) as string;
}

function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function renderIcon(
  name: string,
  options?: { size?: number; strokeWidth?: number; color?: string },
): string {
  const key = toPascalCase(name);
  const svg = icons[key];
  if (!svg) return '';

  let result = svg;
  if (options?.size) {
    result = result
      .replace(/width="\d+"/, `width="${options.size}"`)
      .replace(/height="\d+"/, `height="${options.size}"`);
  }
  if (options?.strokeWidth) {
    result = result.replace(/stroke-width="\d+"/, `stroke-width="${options.strokeWidth}"`);
  }
  if (options?.color) {
    result = result.replace(/stroke="currentColor"/, `stroke="${options.color}"`);
  }
  return result;
}
