import type { Slide, GlobalConfig, QuoteModule } from '../types/index.js';
import { escapeHtml } from './utils.js';

export function renderQuote(slide: Slide, _config: GlobalConfig): string {
  let text: string;
  let author: string | undefined;
  let role: string | undefined;

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

  const authorHtml = author ? `<span class="quote-author">${escapeHtml(author)}</span>` : '';
  const roleHtml = role ? `<span class="quote-role">${escapeHtml(role)}</span>` : '';
  const attributionHtml =
    author || role
      ? `<div class="quote-attribution">${authorHtml}${roleHtml}</div>`
      : '';

  return (
    `<div class="module-quote">` +
    `<blockquote class="quote-text">${escapeHtml(text)}</blockquote>` +
    attributionHtml +
    `</div>`
  );
}

function parseQuoteFromContent(content: string): { text: string; author?: string; role?: string } {
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
    const parts = attributionLine.split(/[,·]/).map((s) => s.trim().replace(/\*\*/g, ''));
    author = parts[0];
    role = parts.slice(1).join(', ') || undefined;
  }

  return { text, author, role };
}
