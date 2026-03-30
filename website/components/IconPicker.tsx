import React, { useState, useEffect, useRef, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Iconify Search API — supports lucide, mdi, heroicons, phosphor, tabler, etc.
// ---------------------------------------------------------------------------

const ICONIFY_API = 'https://api.iconify.design'

interface IconEntry {
  name: string       // "lucide:gauge", "mdi:home"
  displayName: string // "gauge", "home"
  prefix: string     // "lucide", "mdi"
}

// Default icon set for autocomplete
const DEFAULT_PREFIX = 'lucide'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface IconPickerProps {
  query: string           // current search text (after the ":")
  position: { top: number; left: number }
  onSelect: (iconName: string) => void
  onClose: () => void
}

export function IconPicker({ query, position, onSelect, onClose }: IconPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [results, setResults] = useState<IconEntry[]>([])
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const abortRef = useRef<AbortController | null>(null)

  // Debounced search via Iconify API
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }

    // Parse prefix:query format
    const colonIdx = q.indexOf(':')
    const prefix = colonIdx > 0 ? q.slice(0, colonIdx) : DEFAULT_PREFIX
    const searchTerm = colonIdx > 0 ? q.slice(colonIdx + 1) : q

    if (!searchTerm) {
      setResults([])
      return
    }

    // Abort previous request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `${ICONIFY_API}/search?query=${encodeURIComponent(searchTerm)}&prefix=${encodeURIComponent(prefix)}&limit=50`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error('API error')
        const data = await res.json()

        const icons: IconEntry[] = (data.icons || []).map((fullName: string) => {
          const [pfx, ...rest] = fullName.split(':')
          const iconName = rest.join(':')
          return {
            name: pfx === DEFAULT_PREFIX ? iconName : fullName,
            displayName: iconName,
            prefix: pfx,
          }
        })
        setResults(icons)
        setSelectedIndex(0)
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          setResults([])
        }
      } finally {
        setLoading(false)
      }
    }, 150) // 150ms debounce

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // Scroll selected item into view
  useEffect(() => {
    const item = itemRefs.current.get(selectedIndex)
    if (item) {
      item.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (results[selectedIndex]) {
          onSelect(results[selectedIndex].name)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [results, selectedIndex, onSelect, onClose])

  if (results.length === 0 && !loading) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 200,
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        width: 320,
        maxHeight: 280,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {loading && results.length === 0 && (
        <div style={{ padding: '12px 16px', color: '#64748b', fontSize: 13 }}>
          Searching...
        </div>
      )}
      <div
        ref={listRef}
        style={{
          overflowY: 'auto',
          padding: '4px 0',
        }}
      >
        {results.map((icon, i) => (
          <div
            key={icon.name}
            ref={(el) => {
              if (el) itemRefs.current.set(i, el)
              else itemRefs.current.delete(i)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 12px',
              cursor: 'pointer',
              background: i === selectedIndex ? '#334155' : 'transparent',
              color: i === selectedIndex ? '#f1f5f9' : '#94a3b8',
              fontSize: 13,
              transition: 'background 0.05s',
            }}
            onClick={() => onSelect(icon.name)}
            onMouseEnter={() => setSelectedIndex(i)}
          >
            <span
              style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                display: 'inline-block',
                background: 'currentColor',
                WebkitMaskImage: `url('${ICONIFY_API}/${icon.prefix}/${icon.displayName}.svg')`,
                maskImage: `url('${ICONIFY_API}/${icon.prefix}/${icon.displayName}.svg')`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              }}
            />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {icon.name}
            </span>
            {icon.prefix !== DEFAULT_PREFIX && (
              <span style={{ fontSize: 11, color: '#475569' }}>
                {icon.prefix}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default IconPicker
