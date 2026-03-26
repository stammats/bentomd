import type { Slide, GlobalConfig, TableModule } from '../types/index.js';
import { escapeHtml } from './utils.js';

export function renderTable(slide: Slide, _config: GlobalConfig): string {
  let headers: string[] = [];
  let rows: string[][] = [];
  let caption: string | undefined;

  const tableItem = (slide.items ?? slide.rawItems ?? []).find(
    (item) => (item as TableModule).headers !== undefined,
  ) as TableModule | undefined;

  if (tableItem) {
    headers = tableItem.headers;
    rows = tableItem.rows;
    caption = tableItem.caption;
  } else {
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
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
      .join('\n') +
    `</tbody>`;

  const captionHtml = caption
    ? `<div class="table-caption">${escapeHtml(caption)}</div>`
    : '';

  return (
    `<div class="module-table" style="width:100%;overflow:hidden">` +
    `<table class="slide-table">${theadHtml}${tbodyHtml}</table>` +
    captionHtml +
    `</div>`
  );
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
  const dataStart = lines[1].includes('---') ? 2 : 1;
  const rows = lines.slice(dataStart).map(parseLine);

  return { headers, rows };
}
