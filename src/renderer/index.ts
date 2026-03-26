import { GlobalConfig } from '../types/index.js';
import { generateCSS } from './styles.js';
import { generateNavigationScript } from './navigation.js';

function googleFontsLink(config: GlobalConfig): string {
  const families: string[] = [];

  // Heading font
  const headingFont = config.fonts?.heading ?? config.fonts?.sans;
  if (headingFont) {
    families.push(headingFont.split(',')[0].trim());
  } else {
    families.push('Inter');
  }

  // Body font (only add if different from heading)
  const bodyFont = config.fonts?.body;
  if (bodyFont) {
    const bodyName = bodyFont.split(',')[0].trim();
    if (!families.includes(bodyName)) {
      families.push(bodyName);
    }
  }

  // Mono font
  const monoFont = config.fonts?.mono;
  if (monoFont) {
    families.push(monoFont.split(',')[0].trim());
  } else {
    families.push('JetBrains Mono');
  }

  const params = families
    .map((f) => 'family=' + encodeURIComponent(f) + ':wght@400;500;600;700')
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export interface RenderDeckOptions {
  debugGrid?: boolean;
}

export function renderDeck(slideHtmls: string[], config: GlobalConfig, options?: RenderDeckOptions): string {
  const title = config.title ?? 'Presentation';
  const lang = config.lang ?? 'en';
  const aspectRatio = config.aspectRatio ?? '16:9';
  const css = generateCSS(config);
  const nav = generateNavigationScript();
  const fontsHref = googleFontsLink(config);
  const debugClass = options?.debugGrid ? ' debug-grid' : '';

  // Check if any slide uses mermaid
  const hasMermaid = slideHtmls.some((h) => h.includes('class="mermaid"'));
  const mermaidScript = hasMermaid ? generateMermaidScript(config) : '';

  const slidesMarkup = slideHtmls
    .map((html, i) => {
      const activeClass = i === 0 ? ' active' : '';
      return `    <div class="slide${activeClass}">${html}</div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontsHref}" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
  <div class="slide-deck${debugClass}" data-aspect="${escapeHtml(aspectRatio)}">
${slidesMarkup}
  </div>
  <script>${nav}</script>${mermaidScript}
  <!-- HMR -->
</body>
</html>`;
}

function generateMermaidScript(config: GlobalConfig): string {
  const p = config.palette ?? {};
  const primary = p.primary ?? '#334155';
  const secondary = p.secondary ?? '#475569';
  const background = p.background ?? '#ffffff';
  const text = p.text ?? '#0f172a';
  const muted = p.muted ?? '#64748b';
  const surface = p.surface ?? '#f1f5f9';

  return `
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      flowchart: { htmlLabels: false, useMaxWidth: true },
      sequence: { useMaxWidth: true },
      themeVariables: {
        primaryColor: '${surface}',
        primaryTextColor: '${text}',
        primaryBorderColor: '${primary}',
        lineColor: '${muted}',
        secondaryColor: '${surface}',
        tertiaryColor: '${surface}',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
        nodeBorder: '${primary}',
        mainBkg: '${surface}',
        nodeTextColor: '${text}',
        edgeLabelBackground: '${background}',
        clusterBkg: '${surface}',
        clusterBorder: '${muted}',
        titleColor: '${text}',
        actorBorder: '${primary}',
        actorBkg: '${surface}',
        actorTextColor: '${text}',
        actorLineColor: '${muted}',
        signalColor: '${text}',
        signalTextColor: '${text}',
        labelBoxBkgColor: '${surface}',
        labelBoxBorderColor: '${primary}',
        labelTextColor: '${text}',
        loopTextColor: '${text}',
        noteBkgColor: '${surface}',
        noteBorderColor: '${primary}',
        noteTextColor: '${text}',
        activationBkgColor: '${surface}',
        activationBorderColor: '${primary}',
        sequenceNumberColor: '${background}',
        sectionBkgColor: '${surface}',
        altSectionBkgColor: '${background}',
        sectionBkgColor2: '${surface}',
        taskBkgColor: '${primary}',
        taskTextColor: '${background}',
        taskTextLightColor: '${background}',
        taskBorderColor: '${primary}',
        activeTaskBkgColor: '${secondary}',
        activeTaskBorderColor: '${secondary}',
        gridColor: '${muted}',
        doneTaskBkgColor: '${muted}',
        taskTextOutsideColor: '${text}',
        pie1: '${primary}',
        pie2: '${secondary}',
        pie3: '#06b6d4',
        pie4: '#10b981',
        pie5: '#f59e0b',
        pie6: '#ef4444',
        pie7: '#8b5cf6',
      },
    });

    async function renderMermaid() {
      if (document.fonts) await document.fonts.ready;
      await mermaid.run();
      // Workaround for mermaid bug: foreignObject dimensions are calculated
      // before fonts load, causing text to overflow node boxes.
      // Resize each foreignObject to match its actual rendered content.
      document.querySelectorAll('.mermaid svg foreignObject').forEach(function(fo) {
        var c = fo.firstElementChild;
        if (!c || !c.textContent.trim()) return;
        var w = c.scrollWidth, h = c.scrollHeight;
        if (w > 1) fo.setAttribute('width', w + 2);
        if (h > 1) fo.setAttribute('height', h + 2);
      });
      document.querySelectorAll('pre.mermaid svg').forEach(function(svg) {
        svg.removeAttribute('style');
        svg.setAttribute('width', '100%');
      });
    }
    renderMermaid().catch(function() {});
  </script>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
