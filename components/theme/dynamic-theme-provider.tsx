"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { useTheme as useNextTheme } from "next-themes"

import type { ThemeConfig, ThemeStorage } from "@/lib/theme/types"
import {
  DEFAULT_THEME,
  PRESET_CSS_VARS,
  THEME_PRESETS,
} from "@/lib/theme/default-theme"
import { persistentThemeStorage } from "@/lib/theme/theme-storage"
import {
  applyThemeToElement,
  deriveTheme,
  getAdjustedTheme,
  themeToCssVars,
  type DerivedTheme,
} from "@/lib/theme/theme-utils"

interface DynamicThemeContextValue {
  theme: ThemeConfig
  derived: DerivedTheme
  defaultTheme: ThemeConfig
  previewTheme: (
    updater: ThemeConfig | ((prev: ThemeConfig) => ThemeConfig)
  ) => void
  applyTheme: (theme?: ThemeConfig) => void
  resetTheme: () => void
}

const DynamicThemeContext = createContext<DynamicThemeContextValue | null>(null)

export function DynamicThemeProvider({
  children,
  storage = persistentThemeStorage,
  defaultTheme = DEFAULT_THEME,
}: {
  children: ReactNode
  storage?: ThemeStorage
  defaultTheme?: ThemeConfig
}) {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme)
  const { resolvedTheme } = useNextTheme()
  const isDarkMode = resolvedTheme === "dark"
  const storageRef = useRef(storage)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    storageRef.current = storage
  }, [storage])

  // Load saved theme before first paint to prevent flash to default on mount / route change
  useLayoutEffect(() => {
    const saved = storageRef.current.getTheme()
    if (saved) {
      if (JSON.stringify(saved) !== JSON.stringify(defaultTheme)) {
        setTheme(saved)
      }
    }
    setHasLoaded(true)
  }, [defaultTheme])

  // Apply CSS vars synchronously before paint to prevent flash; guard until next-themes hydrated and saved theme loaded
  const applyVars = useCallback(
    (currentTheme: ThemeConfig, dark: boolean) => {
      if (typeof document === "undefined") return
      const preset = THEME_PRESETS.find(
        (p) => JSON.stringify(p.theme) === JSON.stringify(currentTheme)
      )
      if (preset && PRESET_CSS_VARS[preset.id]) {
        const vars = PRESET_CSS_VARS[preset.id][dark ? "dark" : "light"]
        for (const [key, value] of Object.entries(vars)) {
          document.documentElement.style.setProperty(key, value)
        }
        const chartVars: Record<string, string> = {
          "--chart-1": preset.theme.charts.chart1,
          "--chart-2": preset.theme.charts.chart2,
          "--chart-3": preset.theme.charts.chart3,
          "--chart-4": preset.theme.charts.chart4,
          "--chart-5": preset.theme.charts.chart5,
          "--topbar-background": vars["--topbar"] ?? preset.theme.topbar.background,
          "--sidebar-background": vars["--sidebar"] ?? preset.theme.sidebar.background,
        }
        for (const [key, value] of Object.entries(chartVars)) {
          document.documentElement.style.setProperty(key, value)
        }
        return
      }
      const effective = getAdjustedTheme(currentTheme, dark)
      const vars = themeToCssVars(effective)
      for (const [key, value] of Object.entries(vars)) {
        document.documentElement.style.setProperty(key, value)
      }
    },
    []
  )

  useLayoutEffect(() => {
    // Don't apply until next-themes has resolved and saved theme has been loaded
    if (!hasLoaded || !resolvedTheme) return
    applyVars(theme, isDarkMode)
  }, [theme, isDarkMode, resolvedTheme, hasLoaded, applyVars])

  // Re-apply on window focus / storage events without resetting theme state
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "dms-theme-config-v1" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as ThemeConfig
          setTheme(parsed)
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // Keep applyThemeToElement as fallback for non-dark case but primary path is mode-aware
  void applyThemeToElement

  const previewTheme = useCallback<DynamicThemeContextValue["previewTheme"]>(
    (updater) => {
      setTheme((prev) =>
        typeof updater === "function"
          ? (updater as (p: ThemeConfig) => ThemeConfig)(prev)
          : updater
      )
    },
    []
  )

  const applyTheme = useCallback<DynamicThemeContextValue["applyTheme"]>(
    (next) => {
      setTheme((prev) => {
        const value = next ?? prev
        storageRef.current.saveTheme(value)
        return value
      })
    },
    []
  )

  const resetTheme = useCallback(() => {
    storageRef.current.clearTheme()
    setTheme(defaultTheme)
  }, [defaultTheme])

  const adjustedForDerived = useMemo(
    () => getAdjustedTheme(theme, isDarkMode),
    [theme, isDarkMode]
  )

  const derived = useMemo(() => {
    try {
      return deriveTheme(adjustedForDerived)
    } catch {
      // For oklch presets, derive fallback to use primary as-is
      return {
        topbarBackground: theme.topbar.background,
        topbarForeground: "#ffffff",
        topbarBorder: theme.topbar.background,
        sidebarBackground: theme.sidebar.background,
        sidebarForeground: "#ffffff",
        sidebarMutedForeground: theme.sidebar.background,
        sidebarHover: theme.sidebar.background,
        sidebarHoverForeground: "#ffffff",
        sidebarActive: theme.primary.color,
        sidebarActiveForeground: "#ffffff",
        sidebarBorder: theme.sidebar.background,
        primary: theme.primary.color,
        primaryForeground: "#ffffff",
        primaryHover: theme.primary.color,
        accent: theme.primary.color,
        accentForeground: "#ffffff",
        ring: theme.primary.color,
        charts: [
          theme.charts.chart1,
          theme.charts.chart2,
          theme.charts.chart3,
          theme.charts.chart4,
          theme.charts.chart5,
        ] as [string, string, string, string, string],
      } as DerivedTheme
    }
  }, [adjustedForDerived, theme])

  const value = useMemo<DynamicThemeContextValue>(
    () => ({
      theme,
      derived,
      defaultTheme,
      previewTheme,
      applyTheme,
      resetTheme,
    }),
    [theme, derived, defaultTheme, previewTheme, applyTheme, resetTheme]
  )

  return (
    <DynamicThemeContext.Provider value={value}>
      {children}
    </DynamicThemeContext.Provider>
  )
}

export function useDynamicTheme() {
  const ctx = useContext(DynamicThemeContext)
  if (!ctx)
    throw new Error("useDynamicTheme must be used within DynamicThemeProvider")
  return ctx
}
