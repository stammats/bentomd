import { parse } from '@bentomd/parser/index.js'
import { renderSlide } from '@bentomd/layouts/index.js'
import { renderDeck } from '@bentomd/renderer/index.js'

const app = document.getElementById('app')!
const filters = document.getElementById('filters')!

const THEMES = ['default', 'ocean', 'sunset', 'forest', 'berry', 'mono'] as const
const STYLES = ['mixed', 'tint', 'solid', 'outline', 'white', 'mono'] as const
const PRIMARIES: Array<{ label: string; value: string | null }> = [
  { label: 'default', value: null },
  { label: 'red #dc2626', value: '#dc2626' },
  { label: 'blue #0017cb', value: '#0017cb' },
]

type Theme = typeof THEMES[number]

let activeTheme: Theme | null = null

function escapeAttr(html: string): string {
  return html.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildMarkdown(theme: string, style: string, primary: string | null): string {
  const primaryLabel = primary ? ` +${primary}` : ''
  const paletteSection = primary
    ? `palette:\n  primary: "${primary}"\n`
    : ''

  return `---
title: Test
theme: ${theme}
style: ${style}
${paletteSection}---

## ${theme} / ${style}${primaryLabel}

### :zap: Feature One
Description text here

### **42K** {sm center}
Users

### :shield: Feature Two {md}
Longer description for this feature cell

### :globe: Global {sm}
Coverage
`
}

function renderCombo(theme: string, style: string, primary: string | null): string {
  const primaryLabel = primary ? `+primary:${primary}` : 'default'
  const cellLabel = primary ? `${style} + primary:${primary}` : style

  const markdown = buildMarkdown(theme, style, primary)
  let fullHtml: string

  try {
    const deck = parse(markdown)
    const slideHtmls = deck.slides.map(slide => renderSlide(slide, deck.config))
    fullHtml = renderDeck(slideHtmls, deck.config)

    const slideIdx = deck.slides.length > 1 ? 1 : 0

    return `
      <div class="slide-wrapper">
        <div class="slide-label">
          <span class="slide-number">${escapeHtml(cellLabel)}</span>
        </div>
        <iframe class="slide-frame"
          srcdoc="${escapeAttr(fullHtml)}"
          loading="lazy"
          onload="this.contentWindow.document.querySelector('.slide-deck').dataset.current='${slideIdx}';
            [...this.contentWindow.document.querySelectorAll('.slide')].forEach((s,j)=>{
              s.classList.toggle('active',j===${slideIdx});
              s.style.display=j===${slideIdx}?'':'none';
            });"
        ></iframe>
      </div>
    `
  } catch (e) {
    return `
      <div class="slide-wrapper" style="padding:16px">
        <div style="color:#ef4444;font-size:12px;font-family:monospace">
          <strong>${escapeHtml(cellLabel)}</strong><br>
          ${escapeHtml(String(e))}
        </div>
      </div>
    `
  }
}

function renderAll() {
  const themesToShow = activeTheme ? [activeTheme] : [...THEMES]

  app.innerHTML = themesToShow.map(theme => {
    const combos = STYLES.flatMap(style =>
      PRIMARIES.map(({ value }) => renderCombo(theme, style, value))
    )

    return `
      <div class="template-section" data-theme="${theme}" id="theme-${theme}">
        <div class="template-header">
          <span class="template-name">${theme}</span>
          <span class="template-desc">6 styles × 3 palettes</span>
          <span class="slide-count">${STYLES.length * PRIMARIES.length} combinations</span>
        </div>
        <div class="slides-grid">
          ${combos.join('')}
        </div>
      </div>
    `
  }).join('')
}

function renderFilters() {
  filters.innerHTML = ''

  const allBtn = document.createElement('button')
  allBtn.className = `filter-btn ${activeTheme === null ? 'active' : ''}`
  allBtn.textContent = 'All'
  allBtn.onclick = () => { activeTheme = null; renderFilters(); renderAll() }
  filters.appendChild(allBtn)

  for (const theme of THEMES) {
    const btn = document.createElement('button')
    btn.className = `filter-btn ${activeTheme === theme ? 'active' : ''}`
    btn.textContent = theme
    btn.onclick = () => { activeTheme = theme; renderFilters(); renderAll() }
    filters.appendChild(btn)
  }
}

renderFilters()
try {
  renderAll()
} catch (e) {
  app.innerHTML = `<pre style="color:#ef4444;padding:24px;white-space:pre-wrap">${e}\n\n${(e as Error).stack}</pre>`
  console.error(e)
}
