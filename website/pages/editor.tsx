import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { parse } from '../../src/parser/index.js'
import { renderSlide } from '../../src/layouts/index.js'
import { renderDeck } from '../../src/renderer/index.js'
import { IconPicker } from '../components/IconPicker'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Document {
  id: string
  name: string
  content: string
  updatedAt: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bentomd-editor-docs'
const ACTIVE_KEY = 'bentomd-editor-active'

const DEFAULT_CONTENT = `---
title: bentomd Demo
aspectRatio: "16:9"
defaults:
  pageNumber: true
---

---
layout: cover
background: "#0f172a"
color: "#f8fafc"
---

# bentomd
## Slide decks from Markdown

Edit this to see live preview →

---
layout: bento
---

### :zap: Fast {sm}
Write slides in plain Markdown

### :palette: Beautiful {sm}
Swiss typography out of the box

### :package: Export {sm}
PDF and standalone HTML

### :layout-grid: 18 Layouts {sm}
Bento, stats, charts, and more

### :code: Open Source {md}
MIT licensed — extend freely

### :monitor: Live Preview {md}
Edit and see changes instantly

---
layout: stats
heading: "Project Overview"
---

### :git-branch: 1.0
Version

### :box: 18
Layouts

### :puzzle: 15
Modules

### :check-circle: 79
Tests Passing
+15 engine tests

---
layout: two-column
heading: "Markdown Syntax"
ratio: "1:1"
---

::left::

### Write naturally

No special tools needed. Just Markdown with \`---\` slide separators and YAML frontmatter.

- **Layouts** via \`layout:\` field
- **Icons** via \`:icon-name:\` syntax
- **Sections** via \`::left::\` / \`::right::\`

::right::

### Example

\`\`\`markdown
---
layout: stats
heading: "Metrics"
---

### :users: 10k
Active Users

### :trending-up: 42%
Growth Rate
\`\`\`

---
layout: chart
type: bar
heading: "Quarterly Revenue"
title: "2026 Performance (USD thousands)"
---

### Q1: 120
### Q2: 185
### Q3: 240
### Q4: 310

---
layout: chart
type: pie
title: "Traffic Sources"
---

### Organic Search: 45
### Direct: 25
### Social: 20
### Referral: 10

---
layout: features
heading: "Why bentomd?"
summary: "Everything you need for developer presentations"
columns: 3
---

### :file-text: Markdown Native
Write in the format you already know. No GUI, no drag-and-drop — just text.

### :grid-3x3: Bento Grid
Auto-packing layout inspired by Apple. Sizes: sm, md, lg, tall, hero, wide.

### :bar-chart-2: Inline Charts
Bar, pie, and line charts from simple data notation. No libraries to configure.

### :git-merge: Mermaid Diagrams
Flowcharts, sequence diagrams, Gantt charts — automatically themed to your palette.

### :terminal: CLI First
\`bentomd dev\` for hot reload, \`bentomd build\` for static HTML export.

### :palette: Themeable
6 color tokens control everything. Light, dark, or custom — one YAML block.

---
layout: quote
---

> The best way to predict the future of presentations is to write them in Markdown.

---
layout: table
heading: "Layout Reference"
---

| Layout | Description | Best for |
|--------|-------------|----------|
| cover | Full-bleed title slide | Opening |
| bento | Auto-packing grid | Dashboards |
| stats | Metric cards with icons | KPIs |
| chart | Bar, pie, line charts | Data |
| two-column | Side-by-side content | Comparisons |
| features | Icon card grid | Feature lists |
| timeline | Chronological events | Roadmaps |
| quote | Pull quote | Emphasis |

---
layout: end
background: "#0f172a"
color: "#f8fafc"
---

# Try it now
## Edit the Markdown on the left

bentomd.dev
`

const DEFAULT_DOC: Document = {
  id: 'default',
  name: 'Demo Deck',
  content: DEFAULT_CONTENT,
  updatedAt: Date.now(),
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function loadDocs(): Document[] {
  if (typeof window === 'undefined') return [DEFAULT_DOC]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [DEFAULT_DOC]
    const parsed = JSON.parse(raw) as Document[]
    return parsed.length > 0 ? parsed : [DEFAULT_DOC]
  } catch {
    return [DEFAULT_DOC]
  }
}

function saveDocs(docs: Document[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
}

function loadActiveId(): string {
  if (typeof window === 'undefined') return 'default'
  return localStorage.getItem(ACTIVE_KEY) ?? 'default'
}

function saveActiveId(id: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIVE_KEY, id)
}

function generateId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ---------------------------------------------------------------------------
// Mermaid singleton
// ---------------------------------------------------------------------------

let mermaidModule: typeof import('mermaid')['default'] | null = null

async function getMermaid() {
  if (!mermaidModule) {
    const { default: m } = await import('mermaid')
    mermaidModule = m
  }
  return mermaidModule
}

async function preRenderMermaid(html: string): Promise<string> {
  if (!html.includes('class="mermaid"')) return html

  const mermaid = await getMermaid()
  mermaid.initialize({ startOnLoad: false, theme: 'base' })

  const regex = /<pre class="mermaid">([\s\S]*?)<\/pre>/g
  let result = html
  let match
  let counter = 0

  const matches: { full: string; code: string }[] = []
  while ((match = regex.exec(html)) !== null) {
    matches.push({ full: match[0], code: match[1] })
  }

  for (const m of matches) {
    try {
      const id = `mermaid-svg-${counter++}-${Date.now()}`
      const { svg } = await mermaid.render(id, m.code.trim())
      let fitted = svg
        .replace(/style="[^"]*"/, '')
        .replace(/\swidth="[^"]*"/, '')
        .replace(/\sheight="[^"]*"/, '')
        .replace(/<svg /, `<svg data-mermaid-fit="true" style="display:block" `)
      const wrapped = `<div class="mermaid-wrapper" data-mermaid-container="true" style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;flex:1;min-height:0;overflow:hidden">${fitted}</div>`
      result = result.replace(m.full, wrapped)
    } catch {
      // leave as-is
    }
  }

  result = result.replace(/<script type="module">[\s\S]*?import mermaid[\s\S]*?<\/script>/g, '')
  return result
}

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function buildSlideHtml(code: string): { html: string; error: string } {
  try {
    const deck = parse(code)
    const slideHtmls = deck.slides.map((slide: any, i: number) =>
      renderSlide(slide, deck.config, {
        slideIndex: i,
        totalSlides: deck.slides.length,
        budget: {
          canvasWidth: 1920,
          canvasHeight: 1080,
          contentWidth: 1760,
          contentHeight: 840,
          bodyHeight: 608,
          chromeHeight: 232,
        },
      })
    )
    return { html: renderDeck(slideHtmls, deck.config, { debugGrid: false }), error: '' }
  } catch (e: any) {
    return { html: '', error: e.message || String(e) }
  }
}

// ---------------------------------------------------------------------------
// Main Editor component (client-only)
// ---------------------------------------------------------------------------

function EditorInner() {
  // ---- document state ----
  const [docs, setDocs] = useState<Document[]>([DEFAULT_DOC])
  const [activeId, setActiveId] = useState<string>('default')
  const [isLoaded, setIsLoaded] = useState(false)

  // ---- editor state ----
  const [editorContent, setEditorContent] = useState(DEFAULT_CONTENT)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewError, setPreviewError] = useState('')

  // ---- UI state ----
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [hoveredDocId, setHoveredDocId] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor')
  const [isMobile, setIsMobile] = useState(false)

  // ---- Icon picker state ----
  const [iconPicker, setIconPicker] = useState<{
    open: boolean
    query: string
    colonPos: number  // position of the opening ":"
    position: { top: number; left: number }
  }>({ open: false, query: '', colonPos: 0, position: { top: 0, left: 0 } })

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ---- Responsive detection ----
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
      if (e.matches) setSidebarOpen(false)
    }
    handler(mq)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ---- Load from localStorage on mount ----
  useEffect(() => {
    const storedDocs = loadDocs()
    const storedActiveId = loadActiveId()
    const activeDoc = storedDocs.find((d) => d.id === storedActiveId) ?? storedDocs[0]
    setDocs(storedDocs)
    setActiveId(activeDoc.id)
    setEditorContent(activeDoc.content)
    setIsLoaded(true)
  }, [])

  // ---- Sync active doc content into editor when switching docs ----
  useEffect(() => {
    if (!isLoaded) return
    const doc = docs.find((d) => d.id === activeId)
    if (doc) setEditorContent(doc.content)
  }, [activeId, isLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Debounced save to localStorage ----
  const scheduleAutoSave = useCallback((id: string, content: string, currentDocs: Document[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const updated = currentDocs.map((d) =>
        d.id === id ? { ...d, content, updatedAt: Date.now() } : d
      )
      saveDocs(updated)
    }, 500)
  }, [])

  // ---- Update preview on content change ----
  useEffect(() => {
    if (!isLoaded) return
    const { html, error } = buildSlideHtml(editorContent)
    if (error) {
      setPreviewError(error)
      setPreviewHtml('')
      return
    }
    setPreviewError('')
    preRenderMermaid(html)
      .then(setPreviewHtml)
      .catch(() => setPreviewHtml(html))
  }, [editorContent, isLoaded])

  // ---- Handlers ----

  const handleContentChange = useCallback(
    (val: string) => {
      setEditorContent(val)
      setDocs((prev) => {
        const next = prev.map((d) =>
          d.id === activeId ? { ...d, content: val } : d
        )
        scheduleAutoSave(activeId, val, next)
        return next
      })

      // Icon picker trigger: detect `:query` pattern at cursor (works anywhere, like Slack)
      requestAnimationFrame(() => {
        const ta = textareaRef.current
        if (!ta) return
        const cursor = ta.selectionStart
        const textBefore = val.substring(0, cursor)

        // Find the last unmatched ":" before cursor
        const lastColon = textBefore.lastIndexOf(':')
        if (lastColon === -1) {
          setIconPicker((p) => ({ ...p, open: false }))
          return
        }

        const afterColon = textBefore.substring(lastColon + 1)
        // Close if: already closed with ":", has newline, too long, or has spaces (icon names use dashes)
        if (afterColon.includes(':') || afterColon.includes('\n') || afterColon.length > 30) {
          setIconPicker((p) => ({ ...p, open: false }))
          return
        }

        // Allow spaces in search query (for tag search like "arrow down")
        // but the colon must follow a space or start of line (not mid-word like http:)
        const charBeforeColon = lastColon > 0 ? textBefore[lastColon - 1] : '\n'
        if (charBeforeColon !== ' ' && charBeforeColon !== '\n' && charBeforeColon !== '\t' && lastColon !== 0) {
          setIconPicker((p) => ({ ...p, open: false }))
          return
        }

        // Calculate popup position from textarea
        const rect = ta.getBoundingClientRect()
        const lines = textBefore.split('\n')
        const lineIndex = lines.length - 1
        const lineHeight = 16 * 1.7
        const top = Math.min(rect.top + 16 + lineIndex * lineHeight - ta.scrollTop, window.innerHeight - 300)
        const left = Math.min(rect.left + 20, window.innerWidth - 340)

        setIconPicker({
          open: true,
          query: afterColon,
          colonPos: lastColon,
          position: { top: Math.max(top, 8), left: Math.max(left, 8) },
        })
      })
    },
    [activeId, scheduleAutoSave]
  )

  const handleIconSelect = useCallback(
    (iconName: string) => {
      const ta = textareaRef.current
      if (!ta) return
      const val = editorContent
      const { colonPos } = iconPicker
      const cursor = ta.selectionStart
      // Replace `:query` with `:icon-name:`
      const newVal = val.substring(0, colonPos) + ':' + iconName + ':' + val.substring(cursor)
      const newCursor = colonPos + iconName.length + 2
      handleContentChange(newVal)
      setIconPicker((p) => ({ ...p, open: false }))
      requestAnimationFrame(() => {
        ta.focus()
        ta.selectionStart = newCursor
        ta.selectionEnd = newCursor
      })
    },
    [editorContent, iconPicker, handleContentChange]
  )

  const handleSelectDoc = useCallback(
    (id: string) => {
      // Save current doc immediately before switching
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        setDocs((prev) => {
          saveDocs(prev)
          return prev
        })
      }
      setActiveId(id)
      saveActiveId(id)
    },
    []
  )

  const handleNewDoc = useCallback(() => {
    const newDoc: Document = {
      id: generateId(),
      name: 'New Presentation',
      content: DEFAULT_CONTENT,
      updatedAt: Date.now(),
    }
    setDocs((prev) => {
      const next = [...prev, newDoc]
      saveDocs(next)
      return next
    })
    setActiveId(newDoc.id)
    saveActiveId(newDoc.id)
    setEditorContent(DEFAULT_CONTENT)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  const handleDeleteDoc = useCallback(
    (id: string) => {
      setDocs((prev) => {
        if (prev.length === 1) return prev // prevent deleting last doc
        const next = prev.filter((d) => d.id !== id)
        saveDocs(next)
        if (id === activeId) {
          const fallback = next[0]
          setActiveId(fallback.id)
          saveActiveId(fallback.id)
          setEditorContent(fallback.content)
        }
        return next
      })
    },
    [activeId]
  )

  const startRename = useCallback((doc: Document) => {
    setRenamingId(doc.id)
    setRenameValue(doc.name)
  }, [])

  const commitRename = useCallback(() => {
    if (!renamingId) return
    setDocs((prev) => {
      const next = prev.map((d) =>
        d.id === renamingId ? { ...d, name: renameValue.trim() || d.name } : d
      )
      saveDocs(next)
      return next
    })
    setRenamingId(null)
  }, [renamingId, renameValue])

  const handlePresentationMode = useCallback(() => {
    if (!previewHtml) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(previewHtml)
    win.document.close()
  }, [previewHtml])

  const handlePrint = useCallback(() => {
    if (!previewHtml) return
    const printHtml = previewHtml.replace(
      '</head>',
      `<style>
        @page { size: 1920px 1080px; margin: 0; }
        @media print {
          html, body { margin: 0; padding: 0; }
          .slide { page-break-after: always; break-after: page; }
          .slide:last-child { page-break-after: avoid; }
        }
      </style></head>`
    )
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(printHtml)
    win.document.close()
    win.addEventListener('load', () => win.print())
  }, [previewHtml])

  // Tab key in textarea
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal = ta.value.substring(0, start) + '  ' + ta.value.substring(end)
      handleContentChange(newVal)
      requestAnimationFrame(() => {
        ta.selectionStart = start + 2
        ta.selectionEnd = start + 2
      })
    }
  }, [handleContentChange])

  const activeDoc = useMemo(() => docs.find((d) => d.id === activeId), [docs, activeId])

  if (!isLoaded) return null

  // ---- Shared sub-renders ----

  const sidebarContent = (
    <aside style={{
      ...styles.sidebar,
      ...(isMobile ? styles.sidebarMobile : {}),
    }}>
      <div style={styles.sidebarHeader}>
        <span style={styles.sidebarTitle}>bentomd</span>
        <button
          style={styles.iconBtn}
          onClick={() => setSidebarOpen(false)}
          title="Close sidebar"
        >
          &#x2715;
        </button>
      </div>

      <button style={styles.newDocBtn} onClick={handleNewDoc}>
        + New Presentation
      </button>

      <div style={styles.docList}>
        {docs.map((doc) => (
          <div
            key={doc.id}
            style={{
              ...styles.docItem,
              ...(doc.id === activeId ? styles.docItemActive : {}),
              ...(hoveredDocId === doc.id && doc.id !== activeId ? { background: '#1a2535' } : {}),
            }}
            onClick={() => { handleSelectDoc(doc.id); if (isMobile) setSidebarOpen(false) }}
            onMouseEnter={() => setHoveredDocId(doc.id)}
            onMouseLeave={() => setHoveredDocId(null)}
          >
            {renamingId === doc.id ? (
              <input
                autoFocus
                style={styles.renameInput}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') setRenamingId(null)
                  e.stopPropagation()
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span style={styles.docName}>{doc.name}</span>
            )}
            <div
              style={{
                ...styles.docActions,
                opacity: isMobile || hoveredDocId === doc.id || renamingId === doc.id ? 1 : 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                style={styles.docActionBtn}
                title="Rename"
                onClick={() => startRename(doc)}
              >
                ✎
              </button>
              {docs.length > 1 && (
                <button
                  style={styles.docActionBtn}
                  title="Delete"
                  onClick={() => handleDeleteDoc(doc.id)}
                >
                  &#x1F5D1;
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )

  const editorPane = (
    <div style={{
      ...styles.editorPane,
      ...(isMobile && mobileTab !== 'editor' ? { display: 'none' } : {}),
    }}>
      {!isMobile && <div style={styles.paneLabel}>Markdown</div>}
      <textarea
        ref={textareaRef}
        style={styles.textarea}
        value={editorContent}
        onChange={(e) => handleContentChange(e.target.value)}
        onKeyDown={(e) => {
          // Let icon picker handle navigation keys when open
          if (iconPicker.open && ['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
            return // handled by IconPicker's window listener
          }
          handleKeyDown(e)
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
      {iconPicker.open && (
        <IconPicker
          query={iconPicker.query}
          position={iconPicker.position}
          onSelect={handleIconSelect}
          onClose={() => setIconPicker((p) => ({ ...p, open: false }))}
        />
      )}
    </div>
  )

  const previewPane = (
    <div style={{
      ...styles.previewPane,
      ...(isMobile && mobileTab !== 'preview' ? { display: 'none' } : {}),
    }}>
      {!isMobile && <div style={styles.paneLabel}>Preview</div>}
      <div style={styles.previewArea}>
        {previewError ? (
          <div style={styles.errorBox}>{previewError}</div>
        ) : previewHtml ? (
          <iframe
            key={previewHtml.length}
            srcDoc={previewHtml}
            style={styles.previewIframe}
            title="Slide Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div style={styles.emptyPreview}>Rendering...</div>
        )}
      </div>
    </div>
  )

  // ---- Render ----
  return (
    <>
      <Head>
        <title>Editor — bentomd</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>

      <div style={styles.root}>
        {/* Sidebar — overlay on mobile */}
        {sidebarOpen && isMobile && (
          <div
            style={styles.sidebarOverlay}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {sidebarOpen && sidebarContent}

        {/* Main area */}
        <div style={styles.main}>
          {/* Toolbar */}
          <header style={{
            ...styles.toolbar,
            ...(isMobile ? styles.toolbarMobile : {}),
          }}>
            {!sidebarOpen && (
              <button
                style={styles.toolbarBtn}
                onClick={() => setSidebarOpen(true)}
                title="Open sidebar"
              >
                &#9776;
              </button>
            )}
            {!isMobile && (
              <span style={styles.toolbarDocName}>{activeDoc?.name ?? ''}</span>
            )}
            <div style={styles.toolbarActions}>
              <button style={styles.toolbarBtn} onClick={handlePresentationMode} title="Present">
                &#9654;{!isMobile && ' Present'}
              </button>
              <button style={styles.toolbarBtnPrimary} onClick={handlePrint} title="Export PDF">
                &#128438;{!isMobile && ' Export PDF'}
              </button>
            </div>
          </header>

          {/* Mobile tab switcher */}
          {isMobile && (
            <div style={styles.mobileTabBar}>
              <button
                style={{
                  ...styles.mobileTab,
                  ...(mobileTab === 'editor' ? styles.mobileTabActive : {}),
                }}
                onClick={() => setMobileTab('editor')}
              >
                Markdown
              </button>
              <button
                style={{
                  ...styles.mobileTab,
                  ...(mobileTab === 'preview' ? styles.mobileTabActive : {}),
                }}
                onClick={() => setMobileTab('preview')}
              >
                Preview
              </button>
            </div>
          )}

          {/* Split pane (desktop) / tab content (mobile) */}
          <div style={styles.splitPane}>
            {editorPane}
            {!isMobile && <div style={styles.divider} />}
            {previewPane}
          </div>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    height: '100dvh',
    width: '100vw',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: '#0f172a',
    color: '#f1f5f9',
    position: 'relative',
  },
  sidebar: {
    width: 220,
    minWidth: 220,
    background: '#0f172a',
    borderRight: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarMobile: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '75vw',
    maxWidth: 300,
    zIndex: 100,
    boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
  },
  sidebarOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 14px 10px',
    borderBottom: '1px solid #1e293b',
  },
  sidebarTitle: {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#f1f5f9',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: 14,
    padding: '2px 4px',
    borderRadius: 4,
    lineHeight: 1,
  },
  newDocBtn: {
    margin: '10px 12px 6px',
    padding: '8px 12px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#94a3b8',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s',
  },
  docList: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 8px',
  },
  docItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 8px',
    borderRadius: 6,
    cursor: 'pointer',
    marginBottom: 2,
    gap: 4,
    color: '#94a3b8',
    fontSize: 13,
    transition: 'background 0.1s',
  },
  docItemActive: {
    background: '#1e293b',
    color: '#f1f5f9',
  },
  docName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  docActions: {
    display: 'flex',
    gap: 2,
    opacity: 0,
    transition: 'opacity 0.1s',
  },
  docActionBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: 12,
    padding: '2px 4px',
    borderRadius: 4,
  },
  renameInput: {
    flex: 1,
    background: '#0f172a',
    border: '1px solid #2563eb',
    borderRadius: 4,
    color: '#f1f5f9',
    fontSize: 13,
    padding: '2px 6px',
    outline: 'none',
    minWidth: 0,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#0d1117',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 16px',
    height: 48,
    borderBottom: '1px solid #1e293b',
    background: '#0f172a',
    flexShrink: 0,
  },
  toolbarDocName: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  toolbarActions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  toolbarBtn: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#94a3b8',
    fontSize: 13,
    padding: '6px 12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  toolbarMobile: {
    height: 44,
    padding: '0 10px',
    gap: 6,
  },
  toolbarBtnPrimary: {
    background: '#2563eb',
    border: '1px solid #3b82f6',
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    padding: '6px 12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  mobileTabBar: {
    display: 'flex',
    borderBottom: '1px solid #1e293b',
    background: '#0f172a',
    flexShrink: 0,
  },
  mobileTab: {
    flex: 1,
    padding: '10px 0',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#64748b',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
  } as React.CSSProperties,
  mobileTabActive: {
    color: '#f1f5f9',
    borderBottomColor: '#3b82f6',
  },
  splitPane: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  editorPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  paneLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#475569',
    padding: '6px 16px',
    borderBottom: '1px solid #1e293b',
    background: '#0f172a',
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    width: '100%',
    padding: '16px 16px',
    background: '#0d1117',
    color: '#e2e8f0',
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Menlo", "Monaco", monospace',
    fontSize: 16, // >=16px prevents iOS auto-zoom on focus
    lineHeight: 1.7,
    boxSizing: 'border-box',
    tabSize: 2,
  },
  divider: {
    width: 1,
    background: '#1e293b',
    flexShrink: 0,
  },
  previewPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
    background: '#111827',
  },
  previewArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
    padding: 24,
  },
  previewIframe: {
    width: '100%',
    aspectRatio: '16 / 9',
    border: 'none',
    borderRadius: 6,
    boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
  },
  errorBox: {
    background: '#1c0a0a',
    border: '1px solid #7f1d1d',
    borderRadius: 6,
    color: '#ef4444',
    fontSize: 13,
    fontFamily: 'monospace',
    padding: '16px 20px',
    whiteSpace: 'pre-wrap',
    maxWidth: 600,
    width: '100%',
  },
  emptyPreview: {
    color: '#334155',
    fontSize: 13,
    fontFamily: 'monospace',
  },
}

// Client-only wrapper — avoids SSR hydration issues with localStorage
const EditorClientOnly = dynamic(() => Promise.resolve(EditorInner), { ssr: false })

// Export as client-only page (no SSR, no Nextra layout)
export default function EditorPage() {
  return <EditorClientOnly />
}

// Opt out of Nextra layout
EditorPage.getLayout = (page: React.ReactNode) => page
