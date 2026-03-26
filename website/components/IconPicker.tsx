import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Load icon data — name + tags from lucide-static
// ---------------------------------------------------------------------------

// @ts-ignore — JSON import
import tagsData from 'lucide-static/tags.json'
import * as lucideIcons from 'lucide-static'

interface IconEntry {
  name: string       // kebab-case: "activity"
  key: string        // PascalCase: "Activity"
  tags: string[]     // semantic tags
  svg: string        // raw SVG string
}

function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

// Build icon catalog once
const ICON_CATALOG: IconEntry[] = Object.entries(tagsData as Record<string, string[]>)
  .map(([name, tags]) => {
    const key = toPascalCase(name)
    const svg = (lucideIcons as Record<string, string>)[key]
    if (!svg) return null
    return { name, key, tags, svg }
  })
  .filter(Boolean) as IconEntry[]

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
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return ICON_CATALOG.slice(0, 50)

    // Split on spaces or dashes for flexible search
    // e.g. "arrow down", "arrow-down", "heart" all work
    const terms = q.split(/[\s-]+/).filter(Boolean)
    const scored = ICON_CATALOG.map((icon) => {
      let score = 0

      // Name match (against both the name and dash-split parts)
      const nameMatch = terms.every((t) => icon.name.includes(t))
      if (nameMatch) score += 10
      // Exact name start bonus
      if (icon.name.startsWith(q.replace(/\s+/g, '-'))) score += 8
      else if (icon.name.startsWith(terms[0])) score += 5

      // Tag match
      const tagStr = icon.tags.join(' ').toLowerCase()
      const tagMatch = terms.every((t) => tagStr.includes(t))
      if (tagMatch) score += 3

      return { icon, score }
    })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)

    return scored.map((s) => s.icon)
  }, [query])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filtered])

  // Scroll selected item into view
  useEffect(() => {
    const item = itemRefs.current.get(selectedIndex)
    if (item) {
      item.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // Keyboard handler — attached to window to capture while textarea is focused
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex].name)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler, true) // capture phase
    return () => window.removeEventListener('keydown', handler, true)
  }, [filtered, selectedIndex, onSelect, onClose])

  if (filtered.length === 0) return null

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
      <div
        ref={listRef}
        style={{
          overflowY: 'auto',
          padding: '4px 0',
        }}
      >
        {filtered.map((icon, i) => (
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              dangerouslySetInnerHTML={{
                __html: icon.svg
                  .replace(/width="\d+"/, 'width="18"')
                  .replace(/height="\d+"/, 'height="18"'),
              }}
            />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {icon.name}
            </span>
            <span style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
              {icon.tags.slice(0, 3).join(', ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default IconPicker
