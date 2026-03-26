import type { LayoutRenderer } from '../types/index.js';
import { renderMarkdown, buildPageStructure } from './base.js';

/**
 * Default slide — standard 5-layer page structure.
 *
 * If slide has `heading` in options, use it directly.
 * Otherwise, extract the first h1 from content and use it as heading.
 */
export const defaultRenderer: LayoutRenderer = (slide, config, context) => {
  let content = slide.content;
  let heading = slide.options.heading;

  // Auto-extract first h1 from content if no explicit heading
  if (!heading && content) {
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      heading = h1Match[1].trim();
      // Remove the matched h1 line from content
      content = content.replace(/^#\s+.+$/m, '').trim();
      // Temporarily set heading so buildPageStructure picks it up
      slide = { ...slide, options: { ...slide.options, heading } };
    }
  }

  const bodyHtml = renderMarkdown(content);
  return buildPageStructure(slide, config, context, bodyHtml);
};
