import React, { createContext, useContext, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

export interface SlideTheme {
  name: string
  label: string
  palette: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    muted: string
  }
}

export const THEMES: SlideTheme[] = [
  {
    name: 'default',
    label: 'Default',
    palette: {
      primary: '#2563eb',
      secondary: '#7c3aed',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      muted: '#64748b',
    },
  },
  {
    name: 'midnight',
    label: 'Midnight',
    palette: {
      primary: '#818cf8',
      secondary: '#c084fc',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      muted: '#94a3b8',
    },
  },
  {
    name: 'forest',
    label: 'Forest',
    palette: {
      primary: '#059669',
      secondary: '#10b981',
      background: '#ffffff',
      surface: '#f0fdf4',
      text: '#052e16',
      muted: '#6b7280',
    },
  },
  {
    name: 'sunset',
    label: 'Sunset',
    palette: {
      primary: '#dc2626',
      secondary: '#f97316',
      background: '#fffbeb',
      surface: '#fef3c7',
      text: '#1c1917',
      muted: '#78716c',
    },
  },
  {
    name: 'ocean',
    label: 'Ocean',
    palette: {
      primary: '#0891b2',
      secondary: '#06b6d4',
      background: '#ffffff',
      surface: '#ecfeff',
      text: '#0c4a6e',
      muted: '#64748b',
    },
  },
  {
    name: 'rose',
    label: 'Rose',
    palette: {
      primary: '#e11d48',
      secondary: '#f43f5e',
      background: '#ffffff',
      surface: '#fff1f2',
      text: '#1c1917',
      muted: '#71717a',
    },
  },
  {
    name: 'mono',
    label: 'Mono',
    palette: {
      primary: '#18181b',
      secondary: '#3f3f46',
      background: '#ffffff',
      surface: '#f4f4f5',
      text: '#09090b',
      muted: '#71717a',
    },
  },
  {
    name: 'none',
    label: 'From Code',
    palette: {
      primary: '', secondary: '', background: '', surface: '', text: '', muted: '',
    },
  },
]

interface ThemeContextValue {
  theme: SlideTheme
  setTheme: (name: string) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES[THEMES.length - 1],
  setTheme: () => {},
})

export function useSlideTheme() {
  return useContext(ThemeContext)
}

export function SlideThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState('none')
  const theme = THEMES.find((t) => t.name === themeName) ?? THEMES[THEMES.length - 1]
  const setTheme = useCallback((name: string) => setThemeName(name), [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function ThemeSelectorInner() {
  const { theme, setTheme } = useSlideTheme()

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      right: 110,
      zIndex: 9999,
      display: 'flex',
      gap: 4,
      background: '#1e293b',
      borderRadius: 8,
      padding: '4px 6px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      opacity: 0.9,
    }}>
      {THEMES.map((t) => (
        <button
          key={t.name}
          onClick={() => setTheme(t.name)}
          title={t.label}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: theme.name === t.name ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
            background: t.name === 'none'
              ? 'linear-gradient(135deg, #ddd 25%, #888 75%)'
              : t.palette.primary,
            cursor: 'pointer',
            padding: 0,
            transition: 'transform 0.1s',
            transform: theme.name === t.name ? 'scale(1.15)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  )
}

export const ThemeSelector = dynamic(() => Promise.resolve(ThemeSelectorInner), { ssr: false })
