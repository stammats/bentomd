import React, { useMemo, useEffect, useState, createContext, useContext, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { parse } from '../../src/parser/index.js'
import { renderSlide } from '../../src/layouts/index.js'
import { renderDeck } from '../../src/renderer/index.js'
import { useSlideTheme } from './ThemeProvider'

// Global debug grid context
const DebugGridContext = createContext({ debugGrid: false, toggle: () => {} })

export function useDebugGrid() {
  return useContext(DebugGridContext)
}

export function DebugGridProvider({ children }: { children: React.ReactNode }) {
  const [debugGrid, setDebugGrid] = useState(false)
  const toggle = useCallback(() => setDebugGrid((v) => !v), [])
  return (
    <DebugGridContext.Provider value={{ debugGrid, toggle }}>
      {children}
    </DebugGridContext.Provider>
  )
}

function DebugGridToggleInner() {
  const { debugGrid, toggle } = useDebugGrid()
  return (
    <button
      onClick={toggle}
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        padding: '8px 14px',
        borderRadius: 8,
        border: '1px solid rgba(100,116,139,0.3)',
        background: debugGrid ? '#2563eb' : '#1e293b',
        color: '#f8fafc',
        fontSize: 13,
        fontFamily: 'monospace',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        opacity: 0.9,
        transition: 'background 0.15s',
      }}
      title="Toggle debug grid overlay"
    >
      {debugGrid ? 'Grid: ON' : 'Grid: OFF'}
    </button>
  )
}

export const DebugGridToggle = dynamic(() => Promise.resolve(DebugGridToggleInner), { ssr: false })

interface SlidePreviewProps {
  code: string
  aspectRatio?: '16:9' | '4:3'
}

// Singleton mermaid import
let mermaidModule: typeof import('mermaid')['default'] | null = null

async function getMermaid() {
  if (!mermaidModule) {
    const { default: m } = await import('mermaid')
    mermaidModule = m
  }
  return mermaidModule
}

function buildThemeVariables(palette?: any) {
  const p = palette ?? {}
  const primary = p.primary ?? '#2563eb'
  const secondary = p.secondary ?? '#7c3aed'
  const background = p.background ?? '#ffffff'
  const surface = p.surface ?? '#f8fafc'
  const text = p.text ?? '#0f172a'
  const muted = p.muted ?? '#64748b'

  return {
    primaryColor: surface,
    primaryTextColor: text,
    primaryBorderColor: primary,
    lineColor: muted,
    secondaryColor: surface,
    tertiaryColor: surface,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    mainBkg: surface,
    nodeTextColor: text,
    nodeBorder: primary,
    edgeLabelBackground: background,
    clusterBkg: surface,
    clusterBorder: muted,
    titleColor: text,
    actorBorder: primary,
    actorBkg: surface,
    actorTextColor: text,
    actorLineColor: muted,
    signalColor: text,
    signalTextColor: text,
    noteBkgColor: surface,
    noteBorderColor: primary,
    noteTextColor: text,
    activationBkgColor: surface,
    activationBorderColor: primary,
    labelBoxBkgColor: surface,
    labelBoxBorderColor: primary,
    labelTextColor: text,
    loopTextColor: text,
    sectionBkgColor: surface,
    altSectionBkgColor: background,
    taskBkgColor: primary,
    taskTextColor: background,
    taskBorderColor: primary,
    activeTaskBkgColor: secondary,
    activeTaskBorderColor: secondary,
    doneTaskBkgColor: muted,
    gridColor: muted,
    taskTextOutsideColor: text,
    pie1: primary,
    pie2: secondary,
    pie3: '#06b6d4',
    pie4: '#10b981',
    pie5: '#f59e0b',
    pie6: '#ef4444',
    pie7: '#8b5cf6',
  }
}

// Pre-render mermaid diagrams to SVG on the client (Next.js page level),
// then inject SVG directly into the slide HTML. No CDN needed in iframe.
async function preRenderMermaid(html: string, palette?: any): Promise<string> {
  if (!html.includes('class="mermaid"')) return html

  const mermaid = await getMermaid()
  // Re-initialize with current palette colors each time
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: buildThemeVariables(palette),
  })

  // Find all <pre class="mermaid">...</pre> blocks and replace with rendered SVG
  const regex = /<pre class="mermaid">([\s\S]*?)<\/pre>/g
  let result = html
  let match
  let counter = 0

  // Collect all matches first
  const matches: { full: string; code: string }[] = []
  while ((match = regex.exec(html)) !== null) {
    matches.push({ full: match[0], code: match[1] })
  }

  for (const m of matches) {
    try {
      const id = `mermaid-svg-${counter++}`
      const { svg } = await mermaid.render(id, m.code.trim())
      // Strip fixed dimensions, mark for fitting
      let fitted = svg
        .replace(/style="[^"]*"/, '')
        .replace(/\swidth="[^"]*"/, '')
        .replace(/\sheight="[^"]*"/, '')
        .replace(/<svg /, `<svg data-mermaid-fit="true" style="display:block" `)
      const wrapped = `<div class="mermaid-wrapper" data-mermaid-container="true" style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;flex:1;min-height:0;overflow:hidden">${fitted}</div>`
      result = result.replace(m.full, wrapped)
    } catch {
      // If render fails, leave the pre block as-is
    }
  }

  // Remove the mermaid CDN script tag since we pre-rendered
  result = result.replace(/<script type="module">[\s\S]*?import mermaid[\s\S]*?<\/script>/g, '')

  // Inject script: compute absolute pixel dimensions to fit SVG inside container at 80%
  const fitScript = `<script>
    function fitMermaidSvgs() {
      document.querySelectorAll('[data-mermaid-container]').forEach(function(container) {
        var svg = container.querySelector('svg[data-mermaid-fit]');
        if (!svg) return;
        var vb = svg.getAttribute('viewBox');
        if (!vb) return;
        var parts = vb.split(/[\\s,]+/).map(Number);
        var svgW = parts[2], svgH = parts[3];
        if (!svgW || !svgH) return;

        // Use the slide-body as reference for available space
        var body = container.closest('.slide-body') || container.parentElement;
        var cW = body.clientWidth * 0.8;
        var cH = body.clientHeight * 0.8;
        if (!cW || !cH) return;

        // Contain: fit to whichever dimension is tighter
        var scale = Math.min(cW / svgW, cH / svgH);
        svg.style.width = Math.floor(svgW * scale) + 'px';
        svg.style.height = Math.floor(svgH * scale) + 'px';
      });
    }
    window.addEventListener('load', fitMermaidSvgs);
    setTimeout(fitMermaidSvgs, 300);
    setTimeout(fitMermaidSvgs, 1000);
  <\/script>`
  result = result.replace('<!-- HMR -->', fitScript + '\\n  <!-- HMR -->')

  return result
}

function SlidePreviewInner({ code, aspectRatio = '16:9' }: SlidePreviewProps) {
  const { debugGrid } = useDebugGrid()
  const { theme } = useSlideTheme()
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')

  const rawResult = useMemo(() => {
    try {
      const deck = parse(code)

      // Apply selected theme palette (unless "From Code" is selected)
      if (theme.name !== 'none') {
        const tp = theme.palette
        deck.config.palette = {
          ...deck.config.palette,
          ...(tp.primary && { primary: tp.primary }),
          ...(tp.secondary && { secondary: tp.secondary }),
          ...(tp.background && { background: tp.background }),
          ...(tp.surface && { surface: tp.surface }),
          ...(tp.text && { text: tp.text }),
          ...(tp.muted && { muted: tp.muted }),
        }
      }

      const slideHtmls = deck.slides.map((slide: any, i: number) =>
        renderSlide(slide, deck.config, {
          slideIndex: i,
          totalSlides: deck.slides.length,
          budget: {
            canvasWidth: 1920, canvasHeight: 1080,
            contentWidth: 1760, contentHeight: 840,
            bodyHeight: 608, chromeHeight: 232,
          },
        })
      )
      return {
        html: renderDeck(slideHtmls, deck.config, { debugGrid }),
        palette: deck.config.palette,
        error: '',
      }
    } catch (e: any) {
      return { html: '', palette: undefined, error: e.message || String(e) }
    }
  }, [code, debugGrid, theme])

  useEffect(() => {
    if (rawResult.error) {
      setError(rawResult.error)
      setHtml('')
      return
    }
    preRenderMermaid(rawResult.html, rawResult.palette)
      .then(setHtml)
      .catch(() => setHtml(rawResult.html))
  }, [rawResult])

  const paddingTop = aspectRatio === '4:3' ? '75%' : '56.25%'

  return (
    <div style={{ margin: '24px 0' }}>
      <div style={{
        position: 'relative', width: '100%', paddingTop,
        background: '#000', borderRadius: '8px',
        overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      }}>
        {error ? (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ef4444', background: '#1e1e1e', padding: '20px',
            fontSize: '14px', fontFamily: 'monospace', whiteSpace: 'pre-wrap',
          }}>
            {error}
          </div>
        ) : html ? (
          <iframe
            srcDoc={html}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%', border: 'none',
            }}
            title="Slide Preview"
          />
        ) : null}
      </div>
    </div>
  )
}

export const SlidePreview = dynamic(() => Promise.resolve(SlidePreviewInner), { ssr: false })
