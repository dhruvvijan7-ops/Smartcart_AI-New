import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type ThemeName = 'light' | 'dark'
export type DensityName = 'comfortable' | 'compact' | 'spacious'

interface UIThemeContextType {
  theme: ThemeName
  setTheme: (t: ThemeName) => void
  toggleTheme: () => void
  density: DensityName
  setDensity: (d: DensityName) => void
  enableAnimations: boolean
  setEnableAnimations: (v: boolean) => void
  resetToDefaults: () => void
}

const THEME_KEY = 'smartcart_ui_theme'
const DENSITY_KEY = 'smartcart_ui_density'
const ANIM_KEY = 'smartcart_ui_animations'

const defaultTheme: ThemeName = 'light'
const defaultDensity: DensityName = 'comfortable'
const defaultAnimations = true

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
  } catch {
    return fallback
  }
}

const UIThemeContext = createContext<UIThemeContextType | null>(null)

export function UIThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() =>
    readStored(THEME_KEY, ['light', 'dark'] as const, defaultTheme),
  )
  const [density, setDensityState] = useState<DensityName>(() =>
    readStored(DENSITY_KEY, ['comfortable', 'compact', 'spacious'] as const, defaultDensity),
  )
  const [enableAnimations, setEnableAnimationsState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(ANIM_KEY)
      return v === null ? defaultAnimations : v === 'true'
    } catch {
      return defaultAnimations
    }
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density)
    try {
      localStorage.setItem(DENSITY_KEY, density)
    } catch {
      /* storage unavailable */
    }
  }, [density])

  useEffect(() => {
    const root = document.documentElement
    if (enableAnimations) root.removeAttribute('data-no-animations')
    else root.setAttribute('data-no-animations', 'true')
    try {
      localStorage.setItem(ANIM_KEY, String(enableAnimations))
    } catch {
      /* storage unavailable */
    }
  }, [enableAnimations])

  const setTheme = useCallback((t: ThemeName) => setThemeState(t), [])
  const toggleTheme = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), [])
  const setDensity = useCallback((d: DensityName) => setDensityState(d), [])
  const setEnableAnimations = useCallback((v: boolean) => setEnableAnimationsState(v), [])
  const resetToDefaults = useCallback(() => {
    setThemeState(defaultTheme)
    setDensityState(defaultDensity)
    setEnableAnimationsState(defaultAnimations)
  }, [])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      density,
      setDensity,
      enableAnimations,
      setEnableAnimations,
      resetToDefaults,
    }),
    [theme, setTheme, toggleTheme, density, setDensity, enableAnimations, setEnableAnimations, resetToDefaults],
  )

  return <UIThemeContext.Provider value={value}>{children}</UIThemeContext.Provider>
}

export function useUITheme(): UIThemeContextType {
  const ctx = useContext(UIThemeContext)
  if (!ctx) throw new Error('useUITheme must be used within UIThemeProvider')
  return ctx
}
