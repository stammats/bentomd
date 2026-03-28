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
title: bentomd Complete Demo
borderRadius: 40
palette:
  primary: "#0984e3"
  secondary: "#6c5ce7"
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

---

---
layout: section
background: "#1e293b"
color: "#f8fafc"
---

# Part 1
## Core Features

---

## 1. Three Cells (auto grid)

Write \`###\` to create cells. Content type is auto-detected.

### :zap: Lightning Fast
Build presentations in seconds with plain Markdown.

### :palette: Swiss Typography
Professional type scale, spacing, and grid out of the box.

### :package: Single File
Export to standalone HTML or PDF. Share anywhere.

---

## 2. Four Metrics (2x2 grid)

Highlight numbers with **bold** syntax.

### **1.0** Version

### **79** Tests Passing

### **12**ms Avg Build Time

### **0** Config Required

---

## 3. Six Features (3x2 grid)

Everything you need to ship faster:
- Zero-config deployment
- Built-in security

### :rocket: Deploy
Static HTML export — host on any platform.

### :shield: Secure
SOC 2 compliant with encryption and SSO.

### :code: Developer First
CLI tools, hot reload, and extensible modules.

### :users: Teams
Real-time collaboration with role-based access.

### :globe: Global
RTL support and locale-aware formatting.

### :bar-chart-2: Data
Charts, tables, and Mermaid diagrams from Markdown.

---

---
layout: section
background: "#0f172a"
color: "#f8fafc"
---

# Part 2
## Content Types

---

## 4. Rich Text Content

Each cell auto-detects its content type:

### :book: Formatted Text
Cells support **bold**, *italic*, \`inline code\`, and [hyperlinks](https://bentomd.dev).

### :list: Bullet Lists
- Ship faster with CI/CD
- Monitor with real-time alerts
- Scale automatically under load
- Pay only for what you use

### :message-circle: Blockquote
> The best way to predict the future is to invent it. — Alan Kay

### :table: Table Data
| Feature | Free | Pro |
|---------|------|-----|
| Slides | 10 | Unlimited |
| Export | HTML | HTML + PDF |
| Themes | 3 | All |

---

## 5. Mermaid Diagrams

### System Architecture
\`\`\`mermaid
graph LR
  A[User] --> B[API Gateway]
  B --> C[Auth Service]
  B --> D[Data Service]
\`\`\`

### :code: Auto-Detected
Use \`\`\`mermaid code fences inside any cell. Diagrams are themed to match your palette.

---

## 6. Metrics with Images in Cells

### :trending-up: **+42**% Revenue Growth
![Chart](https://images.unsplash.com/photo-1543286386-713bdd548da4?w=400&q=80)

### :users: **150K** Active Users
![Team](https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80)

### **$4.2M** Annual Revenue
![Revenue](https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80)

---

## 8. Size Hints

### :layers: **Size Hints** {hero}
Control cell layout with size modifiers:
- \`{hero}\` — large, 2 rows
- \`{tall}\` — half width, 2 rows
- \`{sm}\` — compact, 1/3 width
- \`{wide}\` — full width, 1 row

### **99.9**% Uptime SLA {sm}

### :zap: **5**ms Response {sm}

---

## 9. Full-bleed Image Cell

### Product Dashboard {hero}
![Dashboard](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80)

### :shield: Security
End-to-end encryption with SOC 2 compliance.

### :bar-chart: Analytics
Real-time dashboards with custom alerting.

---

## 10. Icon + Title + Text + Image

### :rocket: Product Launch
Our new dashboard is live with real-time analytics, custom alerts, and team collaboration built in.
![Product](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80)

### :users: **50K+** Active Users

### :star: **4.9** App Store Rating

---

## 11. Lists + Tables in Cells

### :shield: Security Overview
We take security seriously:
- End-to-end encryption
- SOC 2 Type II certified
- SSO with SAML and OIDC
- Role-based access control

### :bar-chart: Performance Metrics
| Metric | Value |
|--------|-------|
| Uptime | 99.99% |
| Latency | 12ms |
| Regions | 20+ |

---

## 12. Vertical Stack (wide)

### :terminal: Step 1: Install {wide}
\`npm install -g bentomd\` — one command to get started.

### :file-text: Step 2: Write Markdown {wide}
Create a \`.bmd\` file with \`---\` slide separators and \`###\` cell separators.

### :rocket: Step 3: Present {wide}
Run \`bentomd dev\` for live preview, or \`bentomd build\` for static HTML export.

---

## 13. Two Cell Layout

### :terminal: How It Works
Write \`---\` to separate slides. Write \`###\` to create bento cells. Add \`##\` for slide titles. Content type is auto-detected from what you write inside each cell.

### :file-text: Just Markdown
No proprietary format. Your \`.bmd\` files are valid Markdown — readable in any text editor, on GitHub, or in your IDE.

---

## 14. Tall + Right Stack

### :layers: **Main Feature** {tall}
Build and deploy with confidence:
- Zero-downtime releases
- Automated rollback
- Built-in monitoring
- Feature flags included

### **99.99**% Uptime {sm}

### :zap: **12**ms Response {sm}

---

## 15. Single Hero

### :rocket: **Ready to Launch** {hero}
bentomd turns your Markdown into beautiful, professional presentations. No design skills needed — just write content and the bento grid handles layout automatically.
- Write in Markdown
- Export to HTML or PDF
- Present from any browser

---
layout: section
background: "#1e293b"
color: "#f8fafc"
---

# Part 3
## Themes & Styles

---
style: mixed
heading: "Style: mixed (default)"
summary: "Bright and dark pairs alternate for visual variety."
---

### :zap: Fast
Lightning performance.

### :shield: Secure
Enterprise grade.

### :code: Open
Full API access.

---
style: tint
heading: "Style: tint"
summary: "Soft pastel backgrounds with accent-colored text."
---

### :anchor: Maritime
Ocean-inspired tones.

### :ship: Voyage
Fresh aquatic palette.

### :compass: Navigate
Clear data presentation.

---
style: solid
heading: "Style: solid"
summary: "Bold accent backgrounds with white text."
---

### :sun: Warm Tones
Commands attention.

### :flame: Vibrant
Creates urgency.

### :sunrise: Golden Hour
Perfect for marketing.

---
style: outline
heading: "Style: outline"
summary: "Clean borders on transparent backgrounds."
---

### :grape: Elegant
Refined modern look.

### :sparkles: Minimal
Content takes center stage.

### :pen-tool: Designer
Crafted with care.

---
style: white
heading: "Style: white"
summary: "White cells with accent-colored text and icons."
---

### :moon: Clean
Distraction-free design.

### :briefcase: Corporate
Professional and classic.

### :file-check: Focused
Content-first approach.

---
style: mono
heading: "Style: mono"
summary: "Single-color palette for brand consistency."
---

### :target: Branded
One color, unified look.

### :layers: Consistent
Brand identity in every cell.

### :palette: On-brand
Your primary color throughout.

---
style: white
background: "#0984e3"
color: "#ffffff"
heading: "Style: white + colored background"
summary: "White cells on a colored slide background."
---

### :cloud: Cloud Native
Deploy anywhere with confidence.

### :lock: Secure
Enterprise-grade security built in.

### :zap: **99.9**% Uptime
Always available for your users.

---
style: white
background: "#e8f4f8"
heading: "Style: white + light background"
summary: "White cells on a soft blue background."
---

### :cloud: Light & Airy
Soft colored backgrounds create a calm, professional feel.

### :sun: Subtle Contrast
White cells gently stand out against the tinted backdrop.

### :palette: Brand Tint
Use your brand color at low opacity for a cohesive look.

---
style: white
background: "#2d3436"
color: "#ffffff"
heading: "Style: white + dark background"
summary: "White cells on a dark slide for dramatic contrast."
---

### :moon: Dark Mode
Elegant dark presentation style.

### :star: Standout
White cells pop on dark backgrounds.

### :eye: High Contrast
Maximum readability and impact.

---
layout: cover
background: "#0f172a"
color: "#f8fafc"
---

# Get Started
## npm install -g bentomd

bentomd.dev
`

const BRAND_CONTENT = `---
title: Brand Presentation
theme: default
style: mono
borderRadius: 40
palette:
  primary: "#0017cb"
defaults:
  pageNumber: true
---

---
layout: cover
background: "#0017cb"
color: "#ffffff"
---

# Product Strategy 2026
## Q2 Planning & Roadmap

---

## Executive Summary

### :target: **3** Strategic Priorities
We're focusing on platform expansion, developer experience, and enterprise readiness this quarter.

### :trending-up: **+42**% Revenue Target
Aggressive but achievable growth driven by enterprise pipeline and self-serve expansion.

### :users: **10K** New Users
Projected monthly active user growth from marketing campaigns and product-led acquisition.

---

## Key Metrics

### **$4.2M** ARR

### **150K** Monthly Active Users

### **99.99**% Uptime SLA

### **12**ms Avg Response Time

---

## Platform Roadmap

### :rocket: **Launch** API v2
Complete REST and GraphQL API redesign with improved rate limiting and webhook support.

### :shield: **SOC 2** Type II
Achieve compliance certification by end of Q2. Audit process already underway.

### :globe: **5** New Regions
Expand infrastructure to APAC and LATAM for lower latency and data residency compliance.

---

## Product Features

### :code: Developer SDK
Native SDKs for Python, Node.js, Go, and Rust with full type safety and auto-generated docs.

### :layout-grid: Dashboard Redesign
New analytics dashboard with customizable widgets, real-time data, and export capabilities.

### :lock: Advanced Security
SSO with SAML/OIDC, audit logging, IP allowlists, and granular role-based permissions.

### :zap: Performance
Edge caching, smart routing, and connection pooling for sub-10ms global response times.

### :bar-chart: Analytics
Funnel analysis, cohort tracking, and custom event pipelines with SQL query access.

### :heart: Customer Success
Dedicated onboarding, quarterly business reviews, and 24/7 priority support for enterprise.

---

## Team & Hiring

### :users: **28** Current Team
Engineering, product, design, and go-to-market across 4 time zones.

### :user-plus: **8** Open Roles
Hiring senior engineers, product managers, and enterprise sales reps.

---
layout: cover
background: "#0017cb"
color: "#ffffff"
---

# Thank You
## Questions?
`

const DEFAULT_DOC: Document = {
  id: 'demo-v3',
  name: 'Complete Demo',
  content: DEFAULT_CONTENT,
  updatedAt: Date.now(),
}

const BRAND_DOC: Document = {
  id: 'brand-sample',
  name: 'Brand Sample (#0017cb)',
  content: BRAND_CONTENT,
  updatedAt: Date.now(),
}

const LIGHT_CONTENT = `---
title: Light Theme Sample
style: white
borderRadius: 40
palette:
  primary: "#0017cb"
  background: "#eef2ff"
defaults:
  pageNumber: true
---

---
layout: cover
background: "#0017cb"
color: "#ffffff"
---

# Quarterly Review
## Q2 2026 Results

---

## Performance Highlights

### :trending-up: **+38**% Revenue
Exceeded target by 8 points driven by enterprise expansion and self-serve growth.

### :users: **12K** New Users
Record monthly signups from product-led acquisition campaigns.

### :zap: **99.99**% Uptime
Zero major incidents this quarter across all regions.

---

## Product Milestones

### :rocket: API v2 Launched
Complete REST and GraphQL redesign with 3x throughput improvement.

### :shield: SOC 2 Certified
Type II certification achieved ahead of schedule.

### :globe: APAC Expansion
New regions in Tokyo, Singapore, and Sydney now live.

### :code: SDK Released
Native SDKs for Python, Node.js, Go, and Rust with full type safety.

### :bar-chart: Analytics Dashboard
Custom widgets, real-time data streams, and SQL query access.

### :heart: NPS Score **72**
Up from 64 last quarter — highest in company history.

---

## Team Growth

### :user-plus: **8** New Hires
Engineering, product, and enterprise sales across 3 time zones.

### :target: **4** Promoted
Internal mobility program showing strong results.

---

## Next Quarter Priorities

### :rocket: **Scale** Infrastructure
Double capacity in EMEA and LATAM regions for data residency compliance.

### :lock: **Launch** Advanced Security
IP allowlists, audit log exports, and custom session policies.

### :users: **Grow** Enterprise Pipeline
Target 15 new enterprise accounts with dedicated onboarding program.

---
layout: cover
background: "#0017cb"
color: "#ffffff"
---

# Thank You
## Questions?
`

const LIGHT_DOC: Document = {
  id: 'light-sample',
  name: 'Light Background + White Cells',
  content: LIGHT_CONTENT,
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
  return localStorage.getItem(ACTIVE_KEY) ?? 'demo-v3'
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

interface PaletteOverride {
  primary?: string
  secondary?: string
  background?: string
  surface?: string
  text?: string
  muted?: string
}

// JS + CSS to show all slides in a scrollable vertical list.
// Each slide keeps its 1920×1080 canvas but is scaled down to fit the container width.
const SCROLL_PREVIEW_SCRIPT = `
<script>
(function() {
  // Override the navigation script: show all slides
  var style = document.createElement('style');
  style.textContent = [
    'html, body { overflow: auto !important; background: #1a1a2e !important; height: auto !important; width: 100% !important; margin: 0; padding: 12px !important; box-sizing: border-box; }',
    '.slide-deck { transform: none !important; width: 100% !important; height: auto !important; position: relative !important; overflow: visible !important; display: flex !important; flex-direction: column !important; gap: 12px !important; }',
    '.slide { display: block !important; position: relative !important; border-radius: 6px !important; overflow: hidden !important; box-shadow: 0 1px 8px rgba(0,0,0,0.3) !important; flex-shrink: 0 !important; transform-origin: top left; }',
    '.slide-nav { display: none !important; }',
    '.slide-counter { display: none !important; }',
  ].join('\\n');
  document.head.appendChild(style);

  function scaleSlides() {
    var slides = document.querySelectorAll('.slide');
    var containerW = document.body.clientWidth - 24; // account for padding
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      var w = parseInt(s.style.width) || 1920;
      var h = parseInt(s.style.height) || 1080;
      var scale = containerW / w;
      s.style.transform = 'scale(' + scale + ')';
      s.style.width = w + 'px';
      s.style.height = h + 'px';
      // Set the container height to the scaled height
      s.style.marginBottom = (-(h * (1 - scale)) + 12) + 'px';
    }
  }
  window.addEventListener('load', scaleSlides);
  window.addEventListener('resize', scaleSlides);
  setTimeout(scaleSlides, 100);
})();
</script>`

function buildSlideHtml(code: string, paletteOverride?: PaletteOverride): { html: string; error: string } {
  try {
    const deck = parse(code)
    if (paletteOverride) {
      deck.config.palette = { ...deck.config.palette, ...paletteOverride }
    }
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
    let html = renderDeck(slideHtmls, deck.config, { debugGrid: false })
    // Inject scroll preview script (overrides navigation to show all slides)
    html = html.replace('</body>', SCROLL_PREVIEW_SCRIPT + '</body>')
    return { html, error: '' }
  } catch (e: any) {
    return { html: '', error: e.message || String(e) }
  }
}

// ---------------------------------------------------------------------------
// Color presets
// ---------------------------------------------------------------------------

const COLOR_PRESETS: Record<string, { label: string; palette: PaletteOverride }> = {
  default: {
    label: 'Default',
    palette: {},
  },
  ocean: {
    label: 'Ocean',
    palette: { primary: '#0984e3', secondary: '#00cec9', surface: '#dfe6e9', text: '#2d3436', muted: '#636e72' },
  },
  sunset: {
    label: 'Sunset',
    palette: { primary: '#e17055', secondary: '#fdcb6e', surface: '#ffeaa7', text: '#2d3436', muted: '#636e72' },
  },
  forest: {
    label: 'Forest',
    palette: { primary: '#00b894', secondary: '#55efc4', surface: '#dfe6e9', text: '#2d3436', muted: '#636e72' },
  },
  berry: {
    label: 'Berry',
    palette: { primary: '#6c5ce7', secondary: '#e84393', surface: '#dfe6e9', text: '#2d3436', muted: '#636e72' },
  },
  dark: {
    label: 'Dark',
    palette: { primary: '#74b9ff', secondary: '#a29bfe', background: '#2d3436', surface: '#636e72', text: '#dfe6e9', muted: '#b2bec3' },
  },
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

  // ---- Settings state ----
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('default')
  const [customMode, setCustomMode] = useState(false)
  const [customPalette, setCustomPalette] = useState<PaletteOverride>({})

  const activePalette = useMemo(() => {
    if (customMode) return customPalette
    return COLOR_PRESETS[selectedPreset]?.palette ?? {}
  }, [customMode, customPalette, selectedPreset])

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

  // ---- Load on mount ----
  // In dev mode, always load the latest default template (skip localStorage)
  const isDev = process.env.NODE_ENV === 'development'
  useEffect(() => {
    if (isDev) {
      setDocs([DEFAULT_DOC])
      setActiveId(DEFAULT_DOC.id)
      setEditorContent(DEFAULT_CONTENT)
      setIsLoaded(true)
      return
    }
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

  // ---- Update preview on content or palette change ----
  useEffect(() => {
    if (!isLoaded) return
    const override = Object.keys(activePalette).length > 0 ? activePalette : undefined
    const { html, error } = buildSlideHtml(editorContent, override)
    if (error) {
      setPreviewError(error)
      setPreviewHtml('')
      return
    }
    setPreviewError('')
    preRenderMermaid(html)
      .then(setPreviewHtml)
      .catch(() => setPreviewHtml(html))
  }, [editorContent, activePalette, isLoaded])

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

        // Only trigger in ### heading lines (where icons actually render)
        const lineStart = textBefore.lastIndexOf('\n') + 1
        const currentLine = textBefore.substring(lineStart)
        if (!currentLine.trimStart().startsWith('###')) {
          setIconPicker((p) => ({ ...p, open: false }))
          return
        }

        // Colon must follow a space or start-of-icon context (not mid-word like http:)
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
      content: `---\ntitle: New Presentation\n---\n\n---\nlayout: cover\n---\n\n# Title\n## Subtitle\n`,
      updatedAt: Date.now(),
    }
    setDocs((prev) => {
      const next = [...prev, newDoc]
      saveDocs(next)
      return next
    })
    setActiveId(newDoc.id)
    saveActiveId(newDoc.id)
    setEditorContent(newDoc.content)
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
      <a href="/templates" style={{ ...styles.newDocBtn, display: 'block', textDecoration: 'none', color: '#64748b', fontSize: 12, margin: '0 12px 6px', padding: '6px 12px' }}>
        Browse Templates
      </a>

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
      {!isMobile && (
        <div style={styles.paneLabel}>
          Markdown
          <span style={{ fontWeight: 400, marginLeft: 12, opacity: 0.6, textTransform: 'none', letterSpacing: 'normal' }}>
            Type : in ### lines for icon picker
          </span>
        </div>
      )}
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
              <button
                style={styles.toolbarBtn}
                onClick={() => {
                  const ta = textareaRef.current
                  if (!ta) return
                  const cursor = ta.selectionStart
                  const val = editorContent
                  const newVal = val.substring(0, cursor) + ':' + val.substring(cursor)
                  handleContentChange(newVal)
                  requestAnimationFrame(() => {
                    ta.focus()
                    ta.selectionStart = cursor + 1
                    ta.selectionEnd = cursor + 1
                  })
                }}
                title="Insert icon (or type : in a ### line)"
              >
                &#9671;{!isMobile && ' Icon'}
              </button>
              <button
                style={styles.toolbarBtn}
                onClick={() => setSettingsOpen(true)}
                title="Settings"
              >
                &#9881;{!isMobile && ' Settings'}
              </button>
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

        {/* Settings dialog */}
        {settingsOpen && (
          <>
            <div style={styles.sidebarOverlay} onClick={() => setSettingsOpen(false)} />
            <div style={styles.settingsDialog}>
              <div style={styles.settingsHeader}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Settings</span>
                <button style={styles.iconBtn} onClick={() => setSettingsOpen(false)}>&#x2715;</button>
              </div>

              <div style={styles.settingsBody}>
                <div style={{ marginBottom: 20 }}>
                  <div style={styles.settingsLabel}>Color Theme</div>
                  <div style={styles.presetGrid}>
                    {Object.entries(COLOR_PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        style={{
                          ...styles.presetBtn,
                          ...(selectedPreset === key && !customMode ? styles.presetBtnActive : {}),
                        }}
                        onClick={() => { setSelectedPreset(key); setCustomMode(false) }}
                      >
                        <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                          <div style={{ width: 14, height: 14, borderRadius: 3, background: preset.palette.primary || '#0984e3' }} />
                          <div style={{ width: 14, height: 14, borderRadius: 3, background: preset.palette.secondary || '#6c5ce7' }} />
                          <div style={{ width: 14, height: 14, borderRadius: 3, background: preset.palette.surface || '#dfe6e9' }} />
                        </div>
                        <span style={{ fontSize: 11 }}>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <div
                      style={{
                        width: 36, height: 20, borderRadius: 10,
                        background: customMode ? '#0984e3' : '#334155',
                        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                      }}
                      onClick={() => setCustomMode(!customMode)}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 8,
                        background: '#fff', position: 'absolute', top: 2,
                        left: customMode ? 18 : 2, transition: 'left 0.2s',
                      }} />
                    </div>
                    <span style={styles.settingsLabel} onClick={() => setCustomMode(!customMode)}>Custom Colors</span>
                  </label>
                </div>

                {customMode && (
                  <div style={styles.customColorGrid}>
                    {(['primary', 'secondary', 'background', 'surface', 'text', 'muted'] as const).map((key) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="color"
                          value={customPalette[key] || (COLOR_PRESETS[selectedPreset]?.palette[key] ?? '#ffffff')}
                          onChange={(e) => setCustomPalette((p) => ({ ...p, [key]: e.target.value }))}
                          style={{ width: 32, height: 28, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                        />
                        <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' }}>{key}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

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
    overflow: 'hidden',
  },
  previewIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
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
  settingsDialog: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 200,
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 12,
    boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
    width: 380,
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  settingsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #334155',
  },
  settingsBody: {
    padding: '20px',
    overflowY: 'auto',
  } as React.CSSProperties,
  settingsLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 8,
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  presetBtn: {
    padding: '10px 8px',
    background: '#0f172a',
    border: '2px solid transparent',
    borderRadius: 8,
    cursor: 'pointer',
    color: '#94a3b8',
    textAlign: 'center',
    transition: 'border-color 0.15s',
  } as React.CSSProperties,
  presetBtnActive: {
    borderColor: '#0984e3',
    color: '#f1f5f9',
  },
  customColorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
    padding: '12px 0',
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
