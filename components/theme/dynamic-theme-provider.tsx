"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { useTheme as useNextTheme } from "next-themes"

import type { ThemeConfig, ThemeStorage } from "@/lib/theme/types"
import { DEFAULT_THEME } from "@/lib/theme/default-theme"
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

  useEffect(() => {
    storageRef.current = storage
  }, [storage])

  useEffect(() => {
    const saved = storageRef.current.getTheme()
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    if (typeof document === "undefined") return
    const effective = getAdjustedTheme(theme, isDarkMode)
    const vars = themeToCssVars(effective)
    for (const [key, value] of Object.entries(vars)) {
      document.documentElement.style.setProperty(key, value)
    }
  }, [theme, isDarkMode])

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

  const value = useMemo<DynamicThemeContextValue>(
    () => ({
      theme,
      derived: deriveTheme(adjustedForDerived),
      defaultTheme,
      previewTheme,
      applyTheme,
      resetTheme,
    }),
    [
      theme,
      adjustedForDerived,
      defaultTheme,
      previewTheme,
      applyTheme,
      resetTheme,
    ]
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
