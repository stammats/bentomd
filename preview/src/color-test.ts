import { parse } from '@bentomd/parser/index.js'
import { renderSlide } from '@bentomd/layouts/index.js'
import { renderDeck } from '@bentomd/renderer/index.js'

const app = document.getElementById('app')!
const filters = document.getElementById('filters')!
const styleFilters = document.getElementById('style-filters')!
const paletteFilters = document.getElementById('palette-filters')!

const THEMES = ['default', 'ocean', 'sunset', 'forest', 'berry', 'mono', 'custom'] as const
const STYLES = ['mixed', 'tint', 'solid', 'outline', 'white', 'mono'] as const
const PRIMARIES: Array<{ label: string; primary: string | null; secondary?: string | null }> = [
  { label: 'default', primary: null },
  { label: 'red #dc2626', primary: '#dc2626' },
  { label: 'blue #0017cb', primary: '#0017cb' },
  { label: 'mercari #4CC9FF', primary: '#4CC9FF' },
  { label: 'mercari #4CC9FF+#FF0311', primary: '#4CC9FF', secondary: '#FF0311' },
  { label: 'green #00b894', primary: '#00b894' },
]

type Theme = typeof THEMES[number]

type Style = typeof STYLES[number]

let activeTheme: Theme | null = null
let activeStyle: Style | null = null
let activePalette: number | null = null  // index into PRIMARIES

function escapeAttr(html: string): string {
  return html.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildMarkdown(theme: string, style: string, primary: string | null, secondary?: string | null): string {
  const primaryLabel = primary ? ` +${primary}` : ''
  const secondaryLabel = secondary ? `+${secondary}` : ''
  let paletteSection = ''
  if (primary || secondary) {
    const lines = ['palette:']
    if (primary) lines.push(`  primary: "${primary}"`)
    if (secondary) lines.push(`  secondary: "${secondary}"`)
    paletteSection = lines.join('\n') + '\n'
  }

  return `---
title: Test
theme: ${theme}
style: ${style}
${paletteSection}---

## ${theme} / ${style}${primaryLabel}${secondaryLabel}

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

function renderCombo(theme: string, style: string, primary: string | null, secondary?: string | null): string {
  const parts = [style]
  if (primary) parts.push(`p:${primary}`)
  if (secondary) parts.push(`s:${secondary}`)
  const cellLabel = parts.join(' + ')

  const markdown = buildMarkdown(theme, style, primary, secondary)
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
  const stylesToShow = activeStyle ? [activeStyle] : [...STYLES]
  const palettesToShow = activePalette !== null ? [PRIMARIES[activePalette]] : [...PRIMARIES]

  app.innerHTML = themesToShow.map(theme => {
    const combos = stylesToShow.flatMap(style =>
      palettesToShow.map(({ primary, secondary }) => renderCombo(theme, style, primary, secondary))
    )
    const count = stylesToShow.length * palettesToShow.length

    return `
      <div class="template-section" data-theme="${theme}" id="theme-${theme}">
        <div class="template-header">
          <span class="template-name">${theme}</span>
          <span class="slide-count">${count} combinations</span>
        </div>
        <div class="slides-grid">
          ${combos.join('')}
        </div>
      </div>
    `
  }).join('')
}

function renderFilters() {
  // Theme filters
  filters.innerHTML = ''
  const allThemeBtn = document.createElement('button')
  allThemeBtn.className = `filter-btn ${activeTheme === null ? 'active' : ''}`
  allThemeBtn.textContent = 'All'
  allThemeBtn.onclick = () => { activeTheme = null; renderFilters(); renderAll() }
  filters.appendChild(allThemeBtn)
  for (const theme of THEMES) {
    const btn = document.createElement('button')
    btn.className = `filter-btn ${activeTheme === theme ? 'active' : ''}`
    btn.textContent = theme
    btn.onclick = () => { activeTheme = theme; renderFilters(); renderAll() }
    filters.appendChild(btn)
  }

  // Style filters
  styleFilters.innerHTML = ''
  const allStyleBtn = document.createElement('button')
  allStyleBtn.className = `filter-btn ${activeStyle === null ? 'active' : ''}`
  allStyleBtn.textContent = 'All'
  allStyleBtn.onclick = () => { activeStyle = null; renderFilters(); renderAll() }
  styleFilters.appendChild(allStyleBtn)
  for (const style of STYLES) {
    const btn = document.createElement('button')
    btn.className = `filter-btn ${activeStyle === style ? 'active' : ''}`
    btn.textContent = style
    btn.onclick = () => { activeStyle = style as Style; renderFilters(); renderAll() }
    styleFilters.appendChild(btn)
  }

  // Palette filters
  paletteFilters.innerHTML = ''
  const allPalBtn = document.createElement('button')
  allPalBtn.className = `filter-btn ${activePalette === null ? 'active' : ''}`
  allPalBtn.textContent = 'All'
  allPalBtn.onclick = () => { activePalette = null; renderFilters(); renderAll() }
  paletteFilters.appendChild(allPalBtn)
  PRIMARIES.forEach((p, i) => {
    const btn = document.createElement('button')
    btn.className = `filter-btn ${activePalette === i ? 'active' : ''}`
    btn.textContent = p.label
    if (p.primary) {
      btn.style.borderLeft = `3px solid ${p.primary}`
    }
    btn.onclick = () => { activePalette = i; renderFilters(); renderAll() }
    paletteFilters.appendChild(btn)
  })
}

renderFilters()
try {
  renderAll()
} catch (e) {
  app.innerHTML = `<pre style="color:#ef4444;padding:24px;white-space:pre-wrap">${e}\n\n${(e as Error).stack}</pre>`
  console.error(e)
}
