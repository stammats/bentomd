import type { Slide, GlobalConfig } from '../types/index.js';
import type { Slot } from '../engine/types.js';
import { renderMarkdown } from './utils.js';

export function renderRichtext(slot: Slot, slide: Slide, _config: GlobalConfig): string {
  let content = slide.content;

  // For two-column/three-column: extract the relevant section
  if (slot.id === 'left' || slot.id === 'right' || slot.id.startsWith('col')) {
    content = extractColumnContent(slot.id, slide.content);
  }

  // Strip leading h1 if heading module already handles it
  if (slide.options.heading || content.match(/^#\s+.+$/m)) {
    content = content.replace(/^#\s+.+$/m, '').trim();
  }

  if (!content) return '';

  return `<div class="module-richtext">${renderMarkdown(content)}</div>`;
}

function extractColumnContent(slotId: string, content: string): string {
  // Two-column markers
  const leftMarker = content.indexOf('::left::');
  const rightMarker = content.indexOf('::right::');

  if (leftMarker !== -1 && rightMarker !== -1) {
    if (slotId === 'left') {
      if (leftMarker < rightMarker) {
        return content.slice(leftMarker + '::left::'.length, rightMarker).trim();
      }
      return content.slice(leftMarker + '::left::'.length).trim();
    }
    if (slotId === 'right') {
      if (rightMarker < leftMarker) {
        return content.slice(rightMarker + '::right::'.length, leftMarker).trim();
      }
      return content.slice(rightMarker + '::right::'.length).trim();
    }
  }

  // Three-column markers: ::col1:: ::col2:: ::col3::
  const colMatch = slotId.match(/^col(\d+)$/);
  if (colMatch) {
    const colNum = parseInt(colMatch[1], 10);
    const markers = ['::col1::', '::col2::', '::col3::'];
    const positions = markers
      .map((m, i) => ({ marker: m, index: content.indexOf(m), num: i + 1 }))
      .filter((p) => p.index !== -1)
      .sort((a, b) => a.index - b.index);

    const pos = positions.find((p) => p.num === colNum);
    if (pos) {
      const start = pos.index + pos.marker.length;
      const nextPos = positions.find((p) => p.index > pos.index);
      const end = nextPos ? nextPos.index : content.length;
      return content.slice(start, end).trim();
    }
  }

  // Fallback for left/right slots: split on h2 headings when no markers are present
  if (slotId === 'left' || slotId === 'right') {
    const h2Sections = splitByH2(content);
    if (h2Sections.length >= 2) {
      if (slotId === 'left') return h2Sections[0];
      return h2Sections.slice(1).join('\n\n');
    }
    // Only one section — give everything to left, nothing to right
    if (slotId === 'left') return content;
    return '';
  }

  // Fallback: return full content (for single-column)
  return content;
}

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
