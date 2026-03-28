import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { parse } from '../../src/parser/index.js'
import { renderSlide } from '../../src/layouts/index.js'
import { renderDeck } from '../../src/renderer/index.js'
import { templates } from '../templates'
import type { Template } from '../templates'

// ---------------------------------------------------------------------------
// Storage helpers (shared with editor)
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bentomd-editor-docs'
const ACTIVE_KEY = 'bentomd-editor-active'

interface Document {
  id: string
  name: string
  content: string
  updatedAt: number
}

function generateId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ---------------------------------------------------------------------------
// Slide preview renderer
// ---------------------------------------------------------------------------

function buildSlideHtml(source: string): string {
  try {
    const deck = parse(source)
    const slides = deck.slides.map((s: any) => renderSlide(s, deck.config))
    return renderDeck(slides, deck.config)
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// Mermaid pre-renderer
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
  let counter = 0
  const matches: { full: string; code: string }[] = []
  let match
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
        .replace(/<svg /, `<svg data-mermaid-fit="true" style="display:block;max-width:100%;max-height:100%;width:auto;height:auto" `)
      const wrapped = `<div class="mermaid-wrapper" data-mermaid-container="true" style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;flex:1;min-height:0;overflow:hidden">${fitted}</div>`
      result = result.replace(m.full, wrapped)
    } catch { /* leave as-is */ }
  }
  result = result.replace(/<script type="module">[\s\S]*?import mermaid[\s\S]*?<\/script>/g, '')
  return result
}

// ---------------------------------------------------------------------------
// Count slides in a template
// ---------------------------------------------------------------------------

function countSlides(source: string): number {
  try {
    const deck = parse(source)
    return deck.slides.length
  } catch {
    return 0
  }
}

// ---------------------------------------------------------------------------
// TemplateCard — shows a live preview of the first slide
// ---------------------------------------------------------------------------

function TemplateCard({ template, onClick }: { template: Template; onClick: () => void }) {
  const [html, setHtml] = useState('')
  const [hovered, setHovered] = useState(false)
  const slideCount = useMemo(() => countSlides(template.content), [template.content])

  useEffect(() => {
    const raw = buildSlideHtml(template.content)
    if (raw) {
      preRenderMermaid(raw).then(setHtml).catch(() => setHtml(raw))
    }
  }, [template.content])

  const previewSrc = useMemo(() => {
    if (!html) return ''
    return html.replace(
      '</head>',
      `<style>
        body { margin: 0; overflow: hidden; }
        .slide:not(:first-child) { display: none !important; }
        .slide { transform-origin: top left; }
      </style></head>`
    )
  }, [html])

  return (
    <div
      style={{
        ...cardStyles.card,
        ...(hovered ? cardStyles.cardHover : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div style={cardStyles.preview}>
        {previewSrc ? (
          <iframe
            srcDoc={previewSrc}
            style={cardStyles.iframe}
            sandbox="allow-scripts"
            tabIndex={-1}
            title={template.name}
          />
        ) : (
          <div style={{
            ...cardStyles.placeholder,
            background: template.thumbnail.background,
          }} />
        )}
        <div style={cardStyles.previewOverlay} />
      </div>
      <div style={cardStyles.info}>
        <div style={cardStyles.nameRow}>
          <span style={cardStyles.name}>{template.name}</span>
          <span style={cardStyles.category}>{slideCount} slides</span>
        </div>
        <div style={cardStyles.desc}>{template.description}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Preview Modal — full slide deck viewer with navigation
// ---------------------------------------------------------------------------

function PreviewModal({
  template,
  onClose,
  onUse,
}: {
  template: Template
  onClose: () => void
  onUse: (t: Template) => void
}) {
  const [html, setHtml] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [iframeScale, setIframeScale] = useState(0.5)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const slideCount = useMemo(() => countSlides(template.content), [template.content])

  // Dynamic scale based on wrapper width
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        setIframeScale(w / 1920)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setCurrentSlide(0)
    const raw = buildSlideHtml(template.content)
    if (raw) {
      preRenderMermaid(raw).then(setHtml).catch(() => setHtml(raw))
    }
  }, [template.content])

  // Show only the current slide
  const slideSrc = useMemo(() => {
    if (!html) return ''
    return html.replace(
      '</head>',
      `<style>
        body { margin: 0; overflow: hidden; }
        .slide { display: none !important; }
        .slide:nth-child(${currentSlide + 1}) { display: flex !important; }
        .slide { transform-origin: top left; }
      </style></head>`
    )
  }, [html, currentSlide])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentSlide((s) => Math.min(s + 1, slideCount - 1))
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentSlide((s) => Math.max(s - 1, 0))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, slideCount])

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={modalStyles.header}>
          <div style={modalStyles.headerLeft}>
            <span style={modalStyles.title}>{template.name}</span>
            <span style={modalStyles.slideCount}>
              {currentSlide + 1} / {slideCount}
            </span>
          </div>
          <div style={modalStyles.headerRight}>
            <button style={modalStyles.useBtn} onClick={() => onUse(template)}>
              Use Template
            </button>
            <button style={modalStyles.closeBtn} onClick={onClose}>
              &#x2715;
            </button>
          </div>
        </div>

        {/* Slide preview */}
        <div style={modalStyles.slideArea}>
          {/* Prev button */}
          <button
            style={{
              ...modalStyles.navBtn,
              ...modalStyles.navBtnLeft,
              ...(currentSlide === 0 ? modalStyles.navBtnDisabled : {}),
            }}
            onClick={() => setCurrentSlide((s) => Math.max(s - 1, 0))}
            disabled={currentSlide === 0}
          >
            &#8249;
          </button>

          {/* Iframe */}
          <div ref={wrapperRef} style={modalStyles.slideWrapper}>
            {slideSrc ? (
              <iframe
                srcDoc={slideSrc}
                style={{
                  ...modalStyles.iframe,
                  transform: `scale(${iframeScale})`,
                }}
                sandbox="allow-scripts"
                tabIndex={-1}
                title={`${template.name} - Slide ${currentSlide + 1}`}
              />
            ) : (
              <div style={{ color: '#475569', fontSize: 14 }}>Loading...</div>
            )}
          </div>

          {/* Next button */}
          <button
            style={{
              ...modalStyles.navBtn,
              ...modalStyles.navBtnRight,
              ...(currentSlide >= slideCount - 1 ? modalStyles.navBtnDisabled : {}),
            }}
            onClick={() => setCurrentSlide((s) => Math.min(s + 1, slideCount - 1))}
            disabled={currentSlide >= slideCount - 1}
          >
            &#8250;
          </button>
        </div>

        {/* Slide dots */}
        <div style={modalStyles.dots}>
          {Array.from({ length: slideCount }, (_, i) => (
            <button
              key={i}
              style={{
                ...modalStyles.dot,
                ...(i === currentSlide ? modalStyles.dotActive : {}),
              }}
              onClick={() => setCurrentSlide(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function TemplatesInner() {
  const router = useRouter()
  const [filter, setFilter] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category))
    return ['all', ...Array.from(cats)]
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return templates
    return templates.filter((t) => t.category === filter)
  }, [filter])

  const handleUseTemplate = useCallback((template: Template) => {
    const newDoc: Document = {
      id: generateId(),
      name: template.name,
      content: template.content,
      updatedAt: Date.now(),
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const docs: Document[] = raw ? JSON.parse(raw) : []
      docs.push(newDoc)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
      localStorage.setItem(ACTIVE_KEY, newDoc.id)
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newDoc]))
      localStorage.setItem(ACTIVE_KEY, newDoc.id)
    }

    router.push('/editor')
  }, [router])

  return (
    <>
      <Head>
        <title>Templates — bentomd</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={pageStyles.root}>
        {/* Header */}
        <header style={pageStyles.header}>
          <div style={pageStyles.headerInner}>
            <div>
              <h1 style={pageStyles.title}>Templates</h1>
              <p style={pageStyles.subtitle}>
                Click a template to preview all slides. Use arrow keys to navigate.
              </p>
            </div>
            <a href="/editor" style={pageStyles.editorLink}>
              Open Editor &rarr;
            </a>
          </div>
        </header>

        {/* Category filter */}
        <div style={pageStyles.filterBar}>
          {categories.map((cat) => (
            <button
              key={cat}
              style={{
                ...pageStyles.filterBtn,
                ...(filter === cat ? pageStyles.filterBtnActive : {}),
              }}
              onClick={() => setFilter(cat)}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={pageStyles.grid}>
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onClick={() => setPreviewTemplate(t)}
            />
          ))}
        </div>

        {/* Preview Modal */}
        {previewTemplate && (
          <PreviewModal
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onUse={handleUseTemplate}
          />
        )}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Card styles
// ---------------------------------------------------------------------------

const cardStyles: Record<string, React.CSSProperties> = {
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    background: '#1e293b',
    border: '1px solid #334155',
    transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  } as React.CSSProperties,
  cardHover: {
    borderColor: '#3b82f6',
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
  },
  preview: {
    position: 'relative',
    aspectRatio: '16 / 9',
    overflow: 'hidden',
    background: '#0f172a',
  } as React.CSSProperties,
  iframe: {
    width: '1920px',
    height: '1080px',
    border: 'none',
    transform: 'scale(0.1667)',
    transformOrigin: 'top left',
    pointerEvents: 'none',
  } as React.CSSProperties,
  previewOverlay: {
    position: 'absolute',
    inset: 0,
    cursor: 'pointer',
  } as React.CSSProperties,
  placeholder: {
    width: '100%',
    height: '100%',
  },
  info: {
    padding: '16px 18px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 700,
    color: '#f1f5f9',
  },
  category: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  desc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 1.5,
  },
}

// ---------------------------------------------------------------------------
// Modal styles
// ---------------------------------------------------------------------------

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  container: {
    width: '92vw',
    maxWidth: 1100,
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 8px',
    flexShrink: 0,
  } as React.CSSProperties,
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#f1f5f9',
  },
  slideCount: {
    fontSize: 14,
    color: '#64748b',
    fontVariantNumeric: 'tabular-nums',
  } as React.CSSProperties,
  useBtn: {
    padding: '8px 20px',
    background: '#2563eb',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 20,
    cursor: 'pointer',
    padding: '4px 8px',
    lineHeight: 1,
  },
  slideArea: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minHeight: 0,
  } as React.CSSProperties,
  slideWrapper: {
    flex: 1,
    aspectRatio: '16 / 9',
    maxHeight: 'calc(92vh - 120px)',
    overflow: 'hidden',
    borderRadius: 12,
    background: '#000',
    position: 'relative',
  } as React.CSSProperties,
  iframe: {
    width: '1920px',
    height: '1080px',
    border: 'none',
    transformOrigin: 'top left',
    // scale is set dynamically but CSS calc doesn't work here,
    // so we approximate for a ~1000px wide container
    transform: 'scale(0.53)',
    pointerEvents: 'none',
  } as React.CSSProperties,
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    border: '1px solid #334155',
    background: 'rgba(30,41,59,0.8)',
    color: '#f1f5f9',
    fontSize: 28,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.15s',
    lineHeight: 1,
    padding: 0,
  } as React.CSSProperties,
  navBtnLeft: {},
  navBtnRight: {},
  navBtnDisabled: {
    opacity: 0.3,
    cursor: 'default',
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    padding: '16px 0 8px',
    flexShrink: 0,
  } as React.CSSProperties,
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    border: 'none',
    background: '#334155',
    cursor: 'pointer',
    padding: 0,
    transition: 'background 0.15s, transform 0.15s',
  },
  dotActive: {
    background: '#3b82f6',
    transform: 'scale(1.3)',
  },
}

// ---------------------------------------------------------------------------
// Page styles
// ---------------------------------------------------------------------------

const pageStyles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100dvh',
    background: '#0f172a',
    color: '#f1f5f9',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    borderBottom: '1px solid #1e293b',
    padding: '40px 0 32px',
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 24,
    flexWrap: 'wrap',
  } as React.CSSProperties,
  title: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: '-0.03em',
    margin: 0,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    margin: '6px 0 0',
  },
  editorLink: {
    fontSize: 14,
    fontWeight: 600,
    color: '#3b82f6',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  filterBar: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px 32px 8px',
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  } as React.CSSProperties,
  filterBtn: {
    padding: '6px 16px',
    borderRadius: 20,
    border: '1px solid #334155',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  } as React.CSSProperties,
  filterBtnActive: {
    background: '#2563eb',
    borderColor: '#2563eb',
    color: '#fff',
  },
  grid: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px 32px 64px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 24,
  } as React.CSSProperties,
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const TemplatesClientOnly = dynamic(() => Promise.resolve(TemplatesInner), { ssr: false })

export default function TemplatesPage() {
  return <TemplatesClientOnly />
}

// Opt out of Nextra layout
TemplatesPage.getLayout = (page: React.ReactNode) => page
