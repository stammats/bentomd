import { marked } from 'marked';
import { Slide, GlobalConfig, RenderContext } from '../types/index.js';
export { renderIcon } from '../modules/utils.js';

// Configure marked for synchronous operation
marked.use({ async: false });

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build the 5-layer page structure HTML.
 * Only include layers that have content.
 */
export function buildPageStructure(
  slide: Slide,
  config: GlobalConfig,
  context: RenderContext,
  bodyHtml: string,
  options?: { dataLayout?: string; extraClasses?: string; extraAttrs?: string }
): string {
  const layout = options?.dataLayout || slide.layout;
  const headerText = slide.options.header ?? config.defaults?.header ?? '';
  const heading = slide.options.heading ?? '';
  const summary = slide.options.summary ?? '';
  const showFooter = slide.options.footer ?? config.defaults?.footer ?? false;
  const showPageNumber = slide.options.pageNumber ?? config.defaults?.pageNumber ?? false;

  // Logo HTML
  const logoHtml = config.logo?.path
    ? `<img class="slide-logo" src="${escapeHtml(config.logo.path)}" style="height:${config.logo.height || 32}px" alt="">`
    : '';

  // Footer HTML
  const footerHtml = resolveFooter(config, context, showFooter, showPageNumber);

  const extraAttrs = options?.extraAttrs ? ` ${options.extraAttrs}` : '';
  const extraClasses = options?.extraClasses ? ` ${options.extraClasses}` : '';

  return `<div class="slide-content${extraClasses}" data-layout="${layout}"${extraAttrs}>
  <div class="slide-header">${headerText ? `<span>${escapeHtml(String(headerText))}</span>` : ''}${logoHtml}</div>
  <div class="slide-heading">${heading ? `<h1>${escapeHtml(String(heading))}</h1>` : ''}</div>
  <div class="slide-summary">${summary ? escapeHtml(String(summary)) : ''}</div>
  <div class="slide-body">${bodyHtml}</div>
  <div class="slide-footer">${footerHtml}</div>
</div>`;
}

function resolveFooter(
  config: GlobalConfig,
  ctx: RenderContext,
  show: boolean | string,
  showPageNumber: boolean
): string {
  if (!show && !showPageNumber) return '';
  const fc = config.footer || {};
  const resolve = (tpl?: string) => {
    if (!tpl) return '';
    return tpl
      .replace('{title}', config.title || '')
      .replace('{author}', config.author || '')
      .replace('{date}', config.date || '')
      .replace('{slideNumber}', String(ctx.slideIndex + 1))
      .replace('{totalSlides}', String(ctx.totalSlides));
  };
  const left = resolve(fc.left) || (typeof show === 'string' ? show : '');
  const center = resolve(fc.center);
  const right = resolve(fc.right) || (showPageNumber ? `${ctx.slideIndex + 1} / ${ctx.totalSlides}` : '');
  return `<span class="footer-left">${left}</span><span class="footer-center">${center}</span><span class="footer-right">${right}</span>`;
}

/** Legacy wrapper for layouts that don't use 5-layer structure (e.g. cover) */
export function wrapSlide(
  layout: string,
  content: string,
  options?: Record<string, unknown>,
): string {
  const dataAttrs = options
    ? Object.entries(options)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => ` data-${k}="${String(v)}"`)
        .join('')
    : '';
  return `<div class="slide-content" data-layout="${layout}"${dataAttrs}>${content}</div>`;
}

export function renderMarkdown(md: string): string {
  return marked.parse(md) as string;
}

