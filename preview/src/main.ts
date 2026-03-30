import { templates } from '@templates/index'
import { parse } from '@bentomd/parser/index.js'
import { renderSlide } from '@bentomd/layouts/index.js'
import { renderDeck } from '@bentomd/renderer/index.js'

const app = document.getElementById('app')!
const filters = document.getElementById('filters')!

const categories = [...new Set(templates.map(t => t.category))]
let activeFilter: string | null = null

function renderAll() {
  const filtered = activeFilter
    ? templates.filter(t => t.category === activeFilter)
    : templates

  app.innerHTML = filtered.map(template => {
    const deck = parse(template.content)
    const slideHtmls = deck.slides.map(slide => renderSlide(slide, deck.config))
    const fullHtml = renderDeck(slideHtmls, deck.config)

    return `
      <div class="template-section" data-category="${template.category}" id="${template.id}">
        <div class="template-header">
          <span class="template-name">${template.name}</span>
          <span class="template-desc">${template.description}</span>
          <span class="slide-count">${deck.slides.length} slides</span>
        </div>
        <div class="slides-grid">
          ${deck.slides.map((slide, i) => {
            const slideId = `${template.id}/p${i + 1}`
            const slideTitle = slide.title ? ` — ${escapeHtml(slide.title)}` : ''
            return `
            <div class="slide-wrapper" data-slide-id="${slideId}">
              <div class="slide-label">
                <span class="slide-number">${i + 1}</span>
                <button class="copy-btn" data-id="${slideId}" title="Copy ID: ${slideId}">
                  <span class="copy-id">${slideId}</span>
                  <span class="copy-icon">⎘</span>
                </button>
              </div>
              <iframe class="slide-frame"
                srcdoc="${escapeAttr(fullHtml)}"
                onload="this.contentWindow.document.querySelector('.slide-deck').dataset.current='${i}';
                  [...this.contentWindow.document.querySelectorAll('.slide')].forEach((s,j)=>{
                    s.classList.toggle('active',j===${i});
                    s.style.display=j===${i}?'':'none';
                  });"
              ></iframe>
            </div>
          `}).join('')}
        </div>
      </div>
    `
  }).join('')

  // Attach copy handlers
  app.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const id = (btn as HTMLElement).dataset.id!
      await navigator.clipboard.writeText(id)
      const el = btn as HTMLElement
      el.classList.add('copied')
      setTimeout(() => el.classList.remove('copied'), 1200)
    })
  })
}

function escapeAttr(html: string): string {
  return html.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderFilters() {
  const allBtn = document.createElement('button')
  allBtn.className = `filter-btn ${activeFilter === null ? 'active' : ''}`
  allBtn.textContent = 'All'
  allBtn.onclick = () => { activeFilter = null; renderFilters(); renderAll() }
  filters.innerHTML = ''
  filters.appendChild(allBtn)

  for (const cat of categories) {
    const btn = document.createElement('button')
    btn.className = `filter-btn ${activeFilter === cat ? 'active' : ''}`
    btn.textContent = cat
    btn.onclick = () => { activeFilter = cat; renderFilters(); renderAll() }
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
