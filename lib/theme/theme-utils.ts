import type { ThemeConfig } from "./types"
import {
  adjustSaturation,
  hexToHsl,
  hslToHex,
  isDark,
  isValidHex,
  mix,
  readableForeground,
} from "./color-utils"
import { THEME_PRESETS } from "./default-theme"

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

/** The preset a theme belongs to, matched by primary color (primaries are preset-owned). */
export function findPresetByPrimary(
  primaryColor: string
): (typeof THEME_PRESETS)[number] | null {
  return (
    THEME_PRESETS.find((p) => p.theme.primary.color === primaryColor) ?? null
  )
}

export interface DerivedTheme {
  topbarBackground: string
  topbarForeground: string
  topbarBorder: string

  sidebarBackground: string
  sidebarForeground: string
  sidebarMutedForeground: string
  sidebarHover: string
  sidebarHoverForeground: string
  sidebarActive: string
  sidebarActiveForeground: string
  sidebarBorder: string
  sidebarRing: string

  primary: string
  primaryForeground: string

  charts: [string, string, string, string, string]
}

export function deriveTheme(config: ThemeConfig): DerivedTheme {
  const topbar = config.topbar.background
  const sidebar = config.sidebar.background
  const primary = config.primary.color

  const sidebarDark = isDark(sidebar)
  const sidebarFg = readableForeground(sidebar)

  // Primary owns only --primary / --primary-foreground. Accent, ring and
  // hover intentionally stay on the old theme (preset / globals.css values
  // are left untouched), so tweaking Primary never recolors them.
  return {
    topbarBackground: topbar,
    topbarForeground: readableForeground(topbar),
    topbarBorder: mix(topbar, isDark(topbar) ? "#ffffff" : "#000000", 0.12),

    sidebarBackground: sidebar,
    sidebarForeground: sidebarFg,
    sidebarMutedForeground: mix(sidebarFg, sidebar, 0.35),
    sidebarHover: mix(sidebar, sidebarDark ? "#ffffff" : "#000000", 0.07),
    sidebarHoverForeground: sidebarFg,
    // Sidebar must never react to primary changes — derive the active
    // state purely from the sidebar background + its foreground.
    sidebarActive: mix(sidebar, sidebarFg, sidebarDark ? 0.18 : 0.12),
    sidebarActiveForeground: readableForeground(
      mix(sidebar, sidebarFg, sidebarDark ? 0.18 : 0.12)
    ),
    sidebarBorder: mix(sidebar, sidebarDark ? "#ffffff" : "#000000", 0.12),
    sidebarRing: mix(sidebar, sidebarFg, 0.35),

    primary,
    primaryForeground: readableForeground(primary),

    charts: [
      config.charts.chart1,
      config.charts.chart2,
      config.charts.chart3,
      config.charts.chart4,
      config.charts.chart5,
    ],
  }
}

function toDarkSurfaceVariant(hex: string): string {
  if (isDark(hex)) return hex
  const hsl = hexToHsl(hex)
  // Preserve hue, clamp saturation, force dark lightness ~0.15-0.20
  const targetL = 0.16 + Math.min(0.04, (1 - hsl.l) * 0.05)
  return hslToHex({ h: hsl.h, s: Math.min(hsl.s, 0.22), l: targetL })
}

function toDarkPrimaryVariant(hex: string): string {
  if (!isDark(hex)) return hex
  const hsl = hexToHsl(hex)
  return hslToHex({
    h: hsl.h,
    s: Math.min(1, hsl.s * 1.05),
    l: clamp(hsl.l + 0.32),
  })
}

function toDarkChartVariant(color: string): string {
  // Chart colors are authored in globals.css (oklch) or per-preset (oklch).
  // Hex-only transforms must never corrupt non-hex values — pass them through.
  if (!isValidHex(color)) return color
  if (!isDark(color)) return color
  const hsl = hexToHsl(color)
  const brightened =
    hsl.l < 0.35 ? hslToHex({ ...hsl, l: clamp(hsl.l + 0.14) }) : color
  return adjustSaturation(brightened, 0.03)
}

/**
 * Canonical chart palette for a preset.
 *
 * Source of truth priority:
 *  1. Explicit `--chart-1..5` entries in `PRESET_CSS_VARS[presetId][mode]`
 *     (e.g. royal-indigo defines distinct dark variants).
 *  2. Otherwise the preset's own `theme.charts` (same hue family as primary).
 *
 * When no preset is active, charts fall back to globals.css
 * (`:root` / `.dark` `--chart-1..5`), which is the default theme.
 */
export function resolvePresetChartVars(
  preset: {
    theme: ThemeConfig
  },
  presetCssVarsForMode?: Record<string, string>
): Record<string, string> {
  const fallback = [
    preset.theme.charts.chart1,
    preset.theme.charts.chart2,
    preset.theme.charts.chart3,
    preset.theme.charts.chart4,
    preset.theme.charts.chart5,
  ]
  const out: Record<string, string> = {}
  for (let i = 0; i < 5; i += 1) {
    const key = `--chart-${i + 1}`
    out[key] = presetCssVarsForMode?.[key] ?? fallback[i]
  }
  return out
}

export function getAdjustedTheme(
  config: ThemeConfig,
  isDarkMode: boolean
): ThemeConfig {
  if (!isDarkMode) return config
  return {
    topbar: { background: toDarkSurfaceVariant(config.topbar.background) },
    sidebar: { background: toDarkSurfaceVariant(config.sidebar.background) },
    primary: { color: toDarkPrimaryVariant(config.primary.color) },
    charts: {
      chart1: toDarkChartVariant(config.charts.chart1),
      chart2: toDarkChartVariant(config.charts.chart2),
      chart3: toDarkChartVariant(config.charts.chart3),
      chart4: toDarkChartVariant(config.charts.chart4),
      chart5: toDarkChartVariant(config.charts.chart5),
    },
  }
}

export function themeToCssVars(config: ThemeConfig): Record<string, string> {
  const d = deriveTheme(config)
  const vars: Record<string, string> = {
    "--topbar-background": d.topbarBackground,
    "--topbar-foreground": d.topbarForeground,
    "--topbar-border": d.topbarBorder,

    "--sidebar-background": d.sidebarBackground,
    "--sidebar": d.sidebarBackground,
    "--sidebar-foreground": d.sidebarForeground,
    "--sidebar-muted-foreground": d.sidebarMutedForeground,
    "--sidebar-hover": d.sidebarHover,
    "--sidebar-accent": d.sidebarHover,
    "--sidebar-accent-foreground": d.sidebarHoverForeground,
    "--sidebar-active": d.sidebarActive,
    "--sidebar-active-foreground": d.sidebarActiveForeground,
    "--sidebar-primary": d.sidebarActive,
    "--sidebar-primary-foreground": d.sidebarActiveForeground,
    "--sidebar-border": d.sidebarBorder,
    "--sidebar-ring": d.sidebarRing,

    "--primary": d.primary,
    "--primary-foreground": d.primaryForeground,
    // NOTE: --primary-hover / --accent / --accent-foreground / --ring are
    // deliberately not written here. They keep the old theme's values
    // (preset or globals.css), so changing Primary only recolors
    // --primary and --primary-foreground.

    "--chart-1": d.charts[0],
    "--chart-2": d.charts[1],
    "--chart-3": d.charts[2],
    "--chart-4": d.charts[3],
    "--chart-5": d.charts[4],
  }
  return vars
}
