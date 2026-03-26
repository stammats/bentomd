import type { LayoutRenderer, TableModule } from '../types/index.js';
import { wrapSlide } from './base.js';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function parseMarkdownTable(content: string): { headers: string[]; rows: string[][] } | null {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|'));
  if (lines.length < 2) return null;

  const parseLine = (line: string): string[] =>
    line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

  const headers = parseLine(lines[0]);

  // Skip separator line (second line with dashes)
  const dataStart = lines[1].includes('---') ? 2 : 1;
  const rows = lines.slice(dataStart).map(parseLine);

  return { headers, rows };
}

export const tableRenderer: LayoutRenderer = (slide, _config) => {
  let headers: string[] = [];
  let rows: string[][] = [];
  let caption: string | undefined;

  // Try typed items first
  const tableItem = (slide.items ?? slide.rawItems ?? []).find(
    (item) => (item as TableModule).headers !== undefined,
  ) as TableModule | undefined;

  if (tableItem) {
    headers = tableItem.headers;
    rows = tableItem.rows;
    caption = tableItem.caption;
  } else {
    // Parse markdown table from content
    const parsed = parseMarkdownTable(slide.content);
    if (parsed) {
      headers = parsed.headers;
      rows = parsed.rows;
    }
  }

  if (!caption) {
    caption = slide.options.caption as string | undefined;
  }

  const theadHtml = headers.length
    ? `<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`
    : '';

  const tbodyHtml =
    `<tbody>` +
    rows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
      )
      .join('\n') +
    `</tbody>`;

  const captionHtml = caption
    ? `<div class="table-caption">${escapeHtml(caption)}</div>`
    : '';

  const inner =
    `<div class="table-container">` +
    `<table class="slide-table">${theadHtml}${tbodyHtml}</table>` +
    `${captionHtml}` +
    `</div>`;

  return wrapSlide('table', inner);
};
