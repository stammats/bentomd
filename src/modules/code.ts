import type { Slide, GlobalConfig, CodeModule } from '../types/index.js';
import { escapeHtml } from './utils.js';

export function renderCode(slide: Slide, _config: GlobalConfig): string {
  let code = '';
  let language = slide.options.language as string | undefined;
  let title = slide.options.title as string | undefined;

  // Try typed items first
  const codeItem = (slide.items ?? []).find(
    (item) => (item as CodeModule).type === 'code',
  ) as CodeModule | undefined;

  if (codeItem) {
    code = codeItem.code;
    language = codeItem.language ?? language;
    title = codeItem.title ?? title;
  } else {
    // Extract code block from markdown content
    const match = slide.content.match(/```(\w+)?\n([\s\S]*?)```/);
    if (match) {
      language = match[1] ?? language;
      code = match[2].trimEnd();
    } else {
      code = slide.content;
    }
  }

  const titleHtml = title
    ? `<div class="code-title">${escapeHtml(title)}</div>`
    : '';

  const langBadge = language
    ? `<span class="code-lang">${escapeHtml(language)}</span>`
    : '';

  return (
    `<div class="module-code" style="width:100%;height:100%;display:flex;flex-direction:column">` +
    `<div style="display:flex;justify-content:space-between;align-items:center">${titleHtml}${langBadge}</div>` +
    `<pre style="flex:1;min-height:0;margin:0;overflow:auto"><code>${escapeHtml(code)}</code></pre>` +
    `</div>`
  );
}
