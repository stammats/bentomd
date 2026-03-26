import type { LayoutRenderer } from '../types/index.js';
import { renderMarkdown, buildPageStructure } from './base.js';

const ratioMap: Record<string, string> = {
  '1:1': '1fr 1fr',
  '2:1': '2fr 1fr',
  '1:2': '1fr 2fr',
  '3:2': '3fr 2fr',
  '2:3': '2fr 3fr',
};

const gapMap: Record<string, string> = {
  sm: '24px',
  md: '48px',
  lg: '64px',
};

const valignMap: Record<string, string> = {
  top: 'start',
  center: 'center',
  bottom: 'end',
};

/**
 * Split content into sections at each `## heading` boundary.
 * Each returned string includes its heading line and the body that follows.
 */
function splitByH2(content: string): string[] {
  const lines = content.split('\n');
  const sections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^##\s/.test(line) && current.length > 0) {
      sections.push(current.join('\n').trim());
      current = [];
    }
    current.push(line);
  }
  if (current.length > 0) {
    sections.push(current.join('\n').trim());
  }

  return sections.filter(Boolean);
}

/**
 * Two-column layout — uses 5-layer page structure.
 * Body contains a `.columns` grid split by `::left::` / `::right::` markers.
 */
export const twoColumnRenderer: LayoutRenderer = (slide, config, context) => {
  const ratio = String(slide.options.ratio ?? '1:1');
  const gap = String(slide.options.gap ?? 'md');
  const valign = String(slide.options.valign ?? 'top');

  const gridCols = ratioMap[ratio] ?? '1fr 1fr';
  const gridGap = gapMap[gap] ?? '48px';
  const alignItems = valignMap[valign] ?? 'start';

  const content = slide.content;
  const leftMarker = content.indexOf('::left::');
  const rightMarker = content.indexOf('::right::');

  let leftMd = '';
  let rightMd = '';

  if (leftMarker !== -1 && rightMarker !== -1) {
    if (leftMarker < rightMarker) {
      leftMd = content.slice(leftMarker + '::left::'.length, rightMarker).trim();
      rightMd = content.slice(rightMarker + '::right::'.length).trim();
    } else {
      rightMd = content.slice(rightMarker + '::right::'.length, leftMarker).trim();
      leftMd = content.slice(leftMarker + '::left::'.length).trim();
    }
  } else {
    // Fallback: split on h2 headings (## ...) when no explicit markers are present
    const h2Sections = splitByH2(content);
    if (h2Sections.length >= 2) {
      leftMd = h2Sections[0];
      rightMd = h2Sections.slice(1).join('\n\n');
    } else {
      // Last resort: split by line count
      const lines = content.split('\n');
      const mid = Math.floor(lines.length / 2);
      leftMd = lines.slice(0, mid).join('\n');
      rightMd = lines.slice(mid).join('\n');
    }
  }

  const leftHtml = renderMarkdown(leftMd);
  const rightHtml = renderMarkdown(rightMd);

  const bodyHtml =
    `<div class="columns" data-cols="2" data-ratio="${ratio}" style="display:grid;grid-template-columns:${gridCols};gap:${gridGap};align-items:${alignItems};height:100%">` +
    `<div class="column-left">${leftHtml}</div>` +
    `<div class="column-right">${rightHtml}</div>` +
    `</div>`;

  return buildPageStructure(slide, config, context, bodyHtml);
};
