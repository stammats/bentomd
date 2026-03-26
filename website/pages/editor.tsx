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
layout: cover
---
# Welcome to bentomd
Create beautiful presentations from Markdown

---
layout: bento
---
### :zap: Fast
Write slides in seconds

### :palette: Beautiful
Swiss typography defaults

### :package: Portable
Single HTML output
`

const DEFAULT_DOC: Document = {
  id: 'default',
  name: 'Untitled Presentation',
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

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    },
    [activeId, scheduleAutoSave]
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

  // ---- Render ----
  return (
    <>
      <Head>
        <title>Editor — bentomd</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div style={styles.root}>
        {/* Sidebar */}
        {sidebarOpen && (
          <aside style={styles.sidebar}>
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
                  }}
                  onClick={() => handleSelectDoc(doc.id)}
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
                  <div style={styles.docActions} onClick={(e) => e.stopPropagation()}>
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
        )}

        {/* Main area */}
        <div style={styles.main}>
          {/* Toolbar */}
          <header style={styles.toolbar}>
            {!sidebarOpen && (
              <button
                style={styles.toolbarBtn}
                onClick={() => setSidebarOpen(true)}
                title="Open sidebar"
              >
                &#9776;
              </button>
            )}
            <span style={styles.toolbarDocName}>{activeDoc?.name ?? ''}</span>
            <div style={styles.toolbarActions}>
              <button style={styles.toolbarBtn} onClick={handlePresentationMode} title="Present (opens in new window)">
                &#9654; Present
              </button>
              <button style={styles.toolbarBtnPrimary} onClick={handlePrint} title="Export to PDF via print dialog">
                &#128438; Export PDF
              </button>
            </div>
          </header>

          {/* Split pane */}
          <div style={styles.splitPane}>
            {/* Editor pane */}
            <div style={styles.editorPane}>
              <div style={styles.paneLabel}>Markdown</div>
              <textarea
                ref={textareaRef}
                style={styles.textarea}
                value={editorContent}
                onChange={(e) => handleContentChange(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>

            {/* Divider */}
            <div style={styles.divider} />

            {/* Preview pane */}
            <div style={styles.previewPane}>
              <div style={styles.paneLabel}>Preview</div>
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
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: '#0f172a',
    color: '#f1f5f9',
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
    padding: '20px 24px',
    background: '#0d1117',
    color: '#e2e8f0',
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Menlo", "Monaco", monospace',
    fontSize: 14,
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

// ---------------------------------------------------------------------------
// CSS hack: show doc action buttons on hover
// ---------------------------------------------------------------------------

const hoverStyle = `
  .doc-item:hover .doc-actions { opacity: 1 !important; }
  .doc-item:hover { background: #1a2535; }
  .new-doc-btn:hover { background: #263344 !important; color: #f1f5f9 !important; }
  .toolbar-btn:hover { background: #263344 !important; }
  .toolbar-btn-primary:hover { background: #1d4ed8 !important; }
`

// Export as client-only page (no SSR, no Nextra layout)
export default function EditorPage() {
  return (
    <>
      <style>{hoverStyle}</style>
      <EditorInner />
    </>
  )
}

// Opt out of Nextra layout
EditorPage.getLayout = (page: React.ReactNode) => page
