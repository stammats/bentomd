import type { LayoutRenderer, QuoteModule } from '../types/index.js';
import { wrapSlide } from './base.js';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function parseQuoteFromContent(content: string): { text: string; author?: string; role?: string } {
  // Parse blockquote format: > text\n\n— Author, Role
  const lines = content.split('\n');
  const quoteLines: string[] = [];
  let attributionLine = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      quoteLines.push(trimmed.slice(1).trim());
    } else if (trimmed.startsWith('—') || trimmed.startsWith('--') || trimmed.startsWith('―')) {
      attributionLine = trimmed.replace(/^[—\-―]+\s*/, '');
    }
  }

  const text = quoteLines.join(' ') || content.replace(/^>\s*/gm, '').trim();

  let author: string | undefined;
  let role: string | undefined;

  if (attributionLine) {
    const parts = attributionLine.split(/[,·]/).map((s) => s.trim());
    author = parts[0];
    role = parts.slice(1).join(', ') || undefined;
  }

  return { text, author, role };
}

export const quoteRenderer: LayoutRenderer = (slide, _config) => {
  let text: string;
  let author: string | undefined;
  let role: string | undefined;

  // Try typed items first
  const quoteItem = (slide.items ?? []).find(
    (item) => (item as QuoteModule).type === 'quote' || (item as QuoteModule).text !== undefined,
  ) as QuoteModule | undefined;

  if (quoteItem) {
    text = quoteItem.text;
    author = quoteItem.author;
    role = quoteItem.role;
  } else {
    const parsed = parseQuoteFromContent(slide.content);
    text = parsed.text;
    author = parsed.author;
    role = parsed.role;
  }

  const size = String(slide.options.style ?? 'lg');

  const authorHtml = author
    ? `<span class="quote-author">${escapeHtml(author)}</span>`
    : '';
  const roleHtml = role
    ? `<span class="quote-role">${escapeHtml(role)}</span>`
    : '';
  const attributionHtml =
    author || role
      ? `<div class="quote-attribution">${authorHtml}${roleHtml}</div>`
      : '';

  const inner =
    `<div class="quote-block quote-size-${size}">` +
    `<div class="quote-mark">\u201C</div>` +
    `<blockquote class="quote-text">${escapeHtml(text)}</blockquote>` +
    `${attributionHtml}` +
    `</div>`;

  return wrapSlide('quote', inner);
};
