import type { ThemeConfig, ThemeStorage } from "./types"

const STORAGE_KEY = "dms-theme-config-v1"

function isThemeConfig(value: unknown): value is ThemeConfig {
  if (!value || typeof value !== "object") return false
  const v = value as Partial<ThemeConfig>
  return (
    typeof v.topbar?.background === "string" &&
    typeof v.sidebar?.background === "string" &&
    typeof v.primary?.color === "string" &&
    typeof v.charts?.chart1 === "string"
  )
}

export const persistentThemeStorage: ThemeStorage = {
  getTheme() {
    if (typeof window === "undefined") return null
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      return isThemeConfig(parsed) ? parsed : null
    } catch {
      return null
    }
  },
  saveTheme(theme) {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
    } catch {
      /* ignore quota / privacy mode errors */
    }
  },
  clearTheme() {
    if (typeof window === "undefined") return
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  },
}

// Keep backward compat: session storage alias used in Palette Playground
export const sessionThemeStorage = persistentThemeStorage
