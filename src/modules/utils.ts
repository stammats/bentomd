import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('java', java);
import { renderBarChart, renderPieChart, renderLineChart, renderColumnChart } from './chart.js';
import type { ChartDataItem } from '../types/index.js';

function highlightCode(code: string, lang?: string): string {
  if (lang && hljs.getLanguage(lang)) {
    return hljs.highlight(code, { language: lang }).value;
  }
  // No language specified: return escaped plain text
  return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


const ICONIFY_CDN = 'https://api.iconify.design';
const DEFAULT_ICON_SET = 'lucide';

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
  let colors = ['currentColor'];
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
    case 'column':
    case 'vbar':
      svg = renderColumnChart(items, colors);
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
        return `<div class="mermaid-container"><pre class="mermaid">${text}</pre></div>`;
      }
      if (lang === 'chart') {
        return renderInlineChart(text);
      }
      const highlighted = highlightCode(text, lang);
      return `<pre><code class="hljs${lang ? ` language-${lang}` : ''}">${highlighted}</code></pre>`;
    },
  },
});

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

/**
 * Parse icon name — supports `icon-name` (default set) or `set:icon-name`.
 */
function parseIconName(name: string): { set: string; icon: string } {
  const colonIdx = name.indexOf(':');
  if (colonIdx > 0) {
    return { set: name.slice(0, colonIdx), icon: name.slice(colonIdx + 1) };
  }
  return { set: DEFAULT_ICON_SET, icon: name };
}

/**
 * Render an icon using Iconify CDN with CSS mask for currentColor support.
 * Supports any Iconify icon set: lucide, mdi, heroicons, phosphor, tabler, etc.
 * Syntax: `icon-name` (lucide default) or `set:icon-name`.
 */
export function renderIcon(
  name: string,
  options?: { size?: number; color?: string },
): string {
  // Parse .size suffix (e.g. "icon-name.lg") — sm, md, lg, xl
  const ICON_SIZES: Record<string, number> = { sm: 32, md: 48, lg: 72, xl: 96 };
  let scaledName = name;
  let sizeOverride: number | undefined;
  const sizeMatch = name.match(/\.(sm|md|lg|xl)$/);
  if (sizeMatch) {
    sizeOverride = ICON_SIZES[sizeMatch[1]];
    scaledName = name.slice(0, -sizeMatch[0].length);
  }
  const { set, icon } = parseIconName(scaledName);
  const url = `${ICONIFY_CDN}/${set}/${icon}.svg`;
  const size = sizeOverride ?? options?.size ?? 48;
  const color = options?.color ?? 'currentColor';
  const maskStyle = [
    `display:inline-block`,
    `width:${size}px`,
    `height:${size}px`,
    `background:${color}`,
    `-webkit-mask-image:url('${url}')`,
    `mask-image:url('${url}')`,
    `-webkit-mask-size:contain`,
    `mask-size:contain`,
    `-webkit-mask-repeat:no-repeat`,
    `mask-repeat:no-repeat`,
    `-webkit-mask-position:center`,
    `mask-position:center`,
  ].join(';');
  return `<span class="icon" style="${maskStyle}" aria-hidden="true"></span>`;
}
