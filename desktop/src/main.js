import { parse, renderSlide, renderDeck } from 'bentomd'

// ── Themes ────────────────────────────────────────────────────────────────────

const THEMES = [
  {
    name: 'none',
    label: 'From Code',
    color: 'linear-gradient(135deg, #94a3b8 50%, #475569 50%)',
    palette: null,
  },
  {
    name: 'default',
    label: 'Default',
    color: '#2563eb',
    palette: { primary: '#2563eb', secondary: '#7c3aed', background: '#ffffff', surface: '#f8fafc', text: '#0f172a', muted: '#64748b' },
  },
  {
    name: 'midnight',
    label: 'Midnight',
    color: '#818cf8',
    palette: { primary: '#818cf8', secondary: '#c084fc', background: '#0f172a', surface: '#1e293b', text: '#f1f5f9', muted: '#94a3b8' },
  },
  {
    name: 'forest',
    label: 'Forest',
    color: '#059669',
    palette: { primary: '#059669', secondary: '#10b981', background: '#ffffff', surface: '#f0fdf4', text: '#052e16', muted: '#6b7280' },
  },
  {
    name: 'sunset',
    label: 'Sunset',
    color: '#dc2626',
    palette: { primary: '#dc2626', secondary: '#f97316', background: '#fffbeb', surface: '#fef3c7', text: '#1c1917', muted: '#78716c' },
  },
  {
    name: 'ocean',
    label: 'Ocean',
    color: '#0891b2',
    palette: { primary: '#0891b2', secondary: '#06b6d4', background: '#ffffff', surface: '#ecfeff', text: '#0c4a6e', muted: '#64748b' },
  },
  {
    name: 'rose',
    label: 'Rose',
    color: '#e11d48',
    palette: { primary: '#e11d48', secondary: '#f43f5e', background: '#ffffff', surface: '#fff1f2', text: '#1c1917', muted: '#71717a' },
  },
  {
    name: 'mono',
    label: 'Mono',
    color: '#18181b',
    palette: { primary: '#18181b', secondary: '#3f3f46', background: '#ffffff', surface: '#f4f4f5', text: '#09090b', muted: '#71717a' },
  },
]

// ── Default content ────────────────────────────────────────────────────────────

const DEFAULT_CONTENT = `---
title: "My Presentation"
aspectRatio: "16:9"
---

---
layout: cover
---

# Welcome to bentomd

## Build beautiful slides from Markdown

Your Name · Date

---
layout: default
---

# Getting Started

Write your slides in Markdown using \`---\` separators.

Each slide can have a different layout specified in its front matter.

- **cover** — title slide
- **default** — content slide
- **two-column** — split content
- **bento** — mosaic grid
- **features** — icon grid
- **stats** — metrics
- **quote** — testimonial
- **section** — divider slide

---
layout: two-column
---

# Two Column Layout

### Left Column

Add content on the left side of your slide with any markdown formatting.

- Bullet points work
- **Bold text** too
- And *italic*

### Right Column

The right column gets equal space automatically.

\`\`\`js
// Code blocks work too
const slide = {
  layout: 'two-column',
}
\`\`\`

---
layout: stats
---

# Key Metrics

### 99.9%
Uptime SLA

### 2.4M
Active Users

### 48ms
Avg Response Time

### $4.2M
ARR

---
layout: section
---

# Thank You

Questions?
`

// ── State ─────────────────────────────────────────────────────────────────────

let state = {
  content: DEFAULT_CONTENT,
  currentSlide: 0,
  aspectRatio: '16:9',
  theme: THEMES[0], // 'none' = from code
  currentFile: null,
  dirty: false,
  slides: [],
  showThumbs: false,
}

// ── Mermaid ───────────────────────────────────────────────────────────────────

let mermaidInstance = null

async function getMermaid() {
  if (!mermaidInstance) {
    const { default: m } = await import('mermaid')
    mermaidInstance = m
  }
  return mermaidInstance
}

function buildMermaidThemeVars(palette) {
  const p = palette ?? {}
  return {
    primaryColor: p.surface ?? '#f8fafc',
    primaryTextColor: p.text ?? '#0f172a',
    primaryBorderColor: p.primary ?? '#2563eb',
    lineColor: p.muted ?? '#64748b',
    secondaryColor: p.surface ?? '#f8fafc',
    tertiaryColor: p.surface ?? '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    mainBkg: p.surface ?? '#f8fafc',
    nodeTextColor: p.text ?? '#0f172a',
    nodeBorder: p.primary ?? '#2563eb',
    edgeLabelBackground: p.background ?? '#ffffff',
  }
}

async function preRenderMermaid(html, palette) {
  if (!html.includes('class="mermaid"')) return html

  const mermaid = await getMermaid()
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: buildMermaidThemeVars(palette),
  })

  const regex = /<pre class="mermaid">([\s\S]*?)<\/pre>/g
  let result = html
  const matches = []
  let match
  while ((match = regex.exec(html)) !== null) {
    matches.push({ full: match[0], code: match[1] })
  }

  let counter = 0
  for (const m of matches) {
    try {
      const id = `mermaid-desktop-${Date.now()}-${counter++}`
      const { svg } = await mermaid.render(id, m.code.trim())
      let fitted = svg
        .replace(/style="[^"]*"/, '')
        .replace(/\swidth="[^"]*"/, '')
        .replace(/\sheight="[^"]*"/, '')
        .replace(/<svg /, `<svg data-mermaid-fit="true" style="display:block" `)
      const wrapped = `<div class="mermaid-wrapper" data-mermaid-container="true" style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;flex:1;min-height:0;overflow:hidden">${fitted}</div>`
      result = result.replace(m.full, wrapped)
    } catch {
      // leave as-is on error
    }
  }

  result = result.replace(/<script type="module">[\s\S]*?import mermaid[\s\S]*?<\/script>/g, '')
  return result
}

// ── Rendering ─────────────────────────────────────────────────────────────────

async function renderPreview() {
  try {
    const deck = parse(state.content)

    // Apply theme palette override
    if (state.theme.palette) {
      deck.config.palette = { ...deck.config.palette, ...state.theme.palette }
    }

    // Respect content's aspectRatio or use toolbar value
    const ar = deck.config.aspectRatio ?? state.aspectRatio

    const canvas = ar === '4:3'
      ? { width: 1024, height: 768, contentWidth: 912, contentHeight: 624, bodyHeight: 432, chromeHeight: 192 }
      : { width: 1920, height: 1080, contentWidth: 1760, contentHeight: 840, bodyHeight: 608, chromeHeight: 232 }

    const slideHtmls = deck.slides.map((slide, i) =>
      renderSlide(slide, deck.config, {
        slideIndex: i,
        totalSlides: deck.slides.length,
        budget: {
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          contentWidth: canvas.contentWidth,
          contentHeight: canvas.contentHeight,
          bodyHeight: canvas.bodyHeight,
          chromeHeight: canvas.chromeHeight,
        },
      })
    )

    const fullHtml = renderDeck(slideHtmls, deck.config, { debugGrid: false })
    const html = await preRenderMermaid(fullHtml, deck.config.palette)

    state.slides = slideHtmls.map((sh, i) => ({
      html: renderDeck([sh], deck.config, { debugGrid: false }),
      index: i,
    }))

    state.aspectRatio = ar

    setErrorBanner(null)
    updateSlideDisplay(html, ar)
    updateSlideCounter(deck.slides.length)
    updateAspectRatioToggle(ar)
  } catch (err) {
    setErrorBanner(err.message || String(err))
  }
}

// ── DOM updates ───────────────────────────────────────────────────────────────

function setErrorBanner(msg) {
  const el = document.getElementById('error-banner')
  if (msg) {
    el.textContent = msg
    el.classList.add('visible')
  } else {
    el.classList.remove('visible')
  }
}

function getAspectPaddingTop(ar) {
  return ar === '4:3' ? '75%' : '56.25%'
}

function updateSlideDisplay(html, ar) {
  const aspect = document.querySelector('.slide-aspect')
  if (!aspect) return
  aspect.style.paddingTop = getAspectPaddingTop(ar)

  const iframe = aspect.querySelector('iframe')
  if (iframe) {
    iframe.srcdoc = html
  }
}

function updateSlideCounter(total) {
  const el = document.getElementById('slide-counter')
  if (el) {
    el.textContent = `${state.currentSlide + 1} / ${total}`
  }
}

function updateAspectRatioToggle(ar) {
  document.querySelectorAll('.ar-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.ar === ar)
  })
}

function updateTitleBar() {
  const fileEl = document.getElementById('toolbar-file')
  if (!fileEl) return
  const name = state.currentFile
    ? state.currentFile.split('/').pop()
    : 'Untitled'
  fileEl.textContent = state.dirty ? name + ' ●' : name
}

// ── File operations ───────────────────────────────────────────────────────────

async function newFile() {
  if (state.dirty) {
    const ok = confirm('Discard unsaved changes?')
    if (!ok) return
  }
  state.content = DEFAULT_CONTENT
  state.currentFile = null
  state.dirty = false
  document.getElementById('editor').value = state.content
  updateTitleBar()
  await renderPreview()
}

async function openFile() {
  try {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const { readTextFile } = await import('@tauri-apps/plugin-fs')

    const filePath = await open({
      filters: [{ name: 'Markdown', extensions: ['md', 'txt'] }],
    })

    if (!filePath) return

    const content = await readTextFile(filePath)
    state.content = content
    state.currentFile = filePath
    state.dirty = false
    document.getElementById('editor').value = content
    updateTitleBar()
    await renderPreview()
  } catch (err) {
    console.error('open failed:', err)
    alert('Could not open file: ' + err.message)
  }
}

async function saveFile() {
  if (!state.currentFile) {
    await saveFileAs()
    return
  }
  try {
    const { writeTextFile } = await import('@tauri-apps/plugin-fs')
    await writeTextFile(state.currentFile, state.content)
    state.dirty = false
    updateTitleBar()
  } catch (err) {
    console.error('save failed:', err)
    alert('Could not save file: ' + err.message)
  }
}

async function saveFileAs() {
  try {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const { writeTextFile } = await import('@tauri-apps/plugin-fs')

    const filePath = await save({
      filters: [{ name: 'Markdown', extensions: ['md'] }],
      defaultPath: 'presentation.md',
    })

    if (!filePath) return

    await writeTextFile(filePath, state.content)
    state.currentFile = filePath
    state.dirty = false
    updateTitleBar()
  } catch (err) {
    console.error('save as failed:', err)
    alert('Could not save file: ' + err.message)
  }
}

async function exportPdf() {
  const iframe = document.querySelector('.slide-aspect iframe')
  if (!iframe) return
  // Trigger print dialog inside the iframe (prints the slide deck)
  iframe.contentWindow.print()
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

function setupKeyboard() {
  document.addEventListener('keydown', async (e) => {
    const mod = e.metaKey || e.ctrlKey
    if (!mod) return

    if (e.key === 'n') { e.preventDefault(); await newFile() }
    else if (e.key === 'o') { e.preventDefault(); await openFile() }
    else if (e.key === 's' && !e.shiftKey) { e.preventDefault(); await saveFile() }
    else if (e.key === 's' && e.shiftKey) { e.preventDefault(); await saveFileAs() }
    else if (e.key === 'p') { e.preventDefault(); await exportPdf() }
  })
}

// ── Resize handle ─────────────────────────────────────────────────────────────

function setupResizeHandle() {
  const handle = document.getElementById('resize-handle')
  const pane = document.getElementById('editor-pane')
  if (!handle || !pane) return

  let dragging = false
  let startX = 0
  let startW = 0

  handle.addEventListener('mousedown', (e) => {
    dragging = true
    startX = e.clientX
    startW = pane.offsetWidth
    handle.classList.add('dragging')
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  })

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return
    const delta = e.clientX - startX
    const newW = Math.max(200, Math.min(window.innerWidth * 0.6, startW + delta))
    pane.style.width = newW + 'px'
  })

  document.addEventListener('mouseup', () => {
    if (!dragging) return
    dragging = false
    handle.classList.remove('dragging')
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  })
}

// ── Build DOM ─────────────────────────────────────────────────────────────────

function buildThemeDots() {
  return THEMES.map(t => `
    <button
      class="theme-dot ${t.name === state.theme.name ? 'active' : ''}"
      data-theme="${t.name}"
      title="${t.label}"
      style="background: ${t.color};"
    ></button>
  `).join('')
}

function buildUI() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div id="toolbar">
      <div class="macos-spacer"></div>
      <div class="toolbar-title">bentomd</div>
      <span id="toolbar-file" class="toolbar-file">Untitled</span>
      <div class="toolbar-sep"></div>
      <button class="toolbar-btn" id="btn-new" title="New (⌘N)">New</button>
      <button class="toolbar-btn" id="btn-open" title="Open (⌘O)">Open</button>
      <button class="toolbar-btn" id="btn-save" title="Save (⌘S)">Save</button>
      <button class="toolbar-btn" id="btn-save-as" title="Save As (⇧⌘S)">Save As</button>
      <div class="toolbar-sep"></div>
      <button class="toolbar-btn" id="btn-export-pdf" title="Export PDF (⌘P)">PDF</button>
      <div class="toolbar-sep"></div>
      <div class="theme-picker" id="theme-picker">${buildThemeDots()}</div>
    </div>

    <div id="main">
      <div id="editor-pane">
        <textarea
          id="editor"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          placeholder="Write your bentomd presentation here..."
        ></textarea>
        <div id="error-banner"></div>
        <div id="resize-handle"></div>
      </div>

      <div id="preview-pane">
        <div id="preview-toolbar">
          <label>Preview</label>
          <div class="preview-spacer"></div>
          <button class="preview-nav-btn" id="btn-prev">&#8592;</button>
          <span id="slide-counter">1 / 1</span>
          <button class="preview-nav-btn" id="btn-next">&#8594;</button>
        </div>

        <div id="preview-scroll">
          <div id="slide-wrapper">
            <div class="slide-aspect" style="padding-top: 56.25%">
              <iframe title="Slide Preview" srcdoc=""></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="statusbar">
      <div class="status-item">
        <span id="status-chars">0 chars</span>
      </div>
      <div class="status-item">
        <span>Aspect:</span>
        <div class="ar-toggle">
          <button class="ar-btn active" data-ar="16:9">16:9</button>
          <button class="ar-btn" data-ar="4:3">4:3</button>
        </div>
      </div>
      <div class="status-item">
        <span id="status-theme">Theme: From Code</span>
      </div>
    </div>
  `
}

// ── Wire up events ────────────────────────────────────────────────────────────

let renderTimeout = null

function scheduleRender() {
  clearTimeout(renderTimeout)
  renderTimeout = setTimeout(() => renderPreview(), 300)
}

function setupEvents() {
  const editor = document.getElementById('editor')
  editor.value = state.content

  editor.addEventListener('input', () => {
    state.content = editor.value
    state.dirty = true
    updateTitleBar()
    updateStatusBar()
    scheduleRender()
  })

  editor.addEventListener('keydown', (e) => {
    // Tab key inserts spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = editor.selectionStart
      const end = editor.selectionEnd
      editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end)
      editor.selectionStart = editor.selectionEnd = start + 2
      state.content = editor.value
      scheduleRender()
    }
  })

  // Toolbar buttons
  document.getElementById('btn-new').addEventListener('click', newFile)
  document.getElementById('btn-open').addEventListener('click', openFile)
  document.getElementById('btn-save').addEventListener('click', saveFile)
  document.getElementById('btn-save-as').addEventListener('click', saveFileAs)
  document.getElementById('btn-export-pdf').addEventListener('click', exportPdf)

  // Theme picker
  document.getElementById('theme-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-dot')
    if (!btn) return
    const name = btn.dataset.theme
    state.theme = THEMES.find(t => t.name === name) ?? THEMES[0]
    document.querySelectorAll('.theme-dot').forEach(d => {
      d.classList.toggle('active', d.dataset.theme === name)
    })
    const statusTheme = document.getElementById('status-theme')
    if (statusTheme) statusTheme.textContent = 'Theme: ' + state.theme.label
    renderPreview()
  })

  // Aspect ratio toggle
  document.querySelectorAll('.ar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.aspectRatio = btn.dataset.ar
      updateAspectRatioToggle(btn.dataset.ar)
      renderPreview()
    })
  })

  // Slide nav
  document.getElementById('btn-prev').addEventListener('click', () => {
    // Navigate to previous slide in the full deck view — just scroll up
    // (The iframe shows the full deck with keyboard navigation)
    const iframe = document.querySelector('.slide-aspect iframe')
    if (iframe?.contentWindow) {
      iframe.contentWindow.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    }
  })

  document.getElementById('btn-next').addEventListener('click', () => {
    const iframe = document.querySelector('.slide-aspect iframe')
    if (iframe?.contentWindow) {
      iframe.contentWindow.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    }
  })
}

function updateStatusBar() {
  const el = document.getElementById('status-chars')
  if (el) el.textContent = state.content.length.toLocaleString() + ' chars'
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  buildUI()
  setupEvents()
  setupResizeHandle()
  setupKeyboard()
  updateStatusBar()
  updateTitleBar()
  await renderPreview()
}

init()
