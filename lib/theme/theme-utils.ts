import type { ThemeConfig } from "./types"
import {
  adjustSaturation,
  hexToHsl,
  hoverVariant,
  hslToHex,
  isDark,
  mix,
  readableForeground,
  rotateHue,
} from "./color-utils"

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

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

  primary: string
  primaryForeground: string
  primaryHover: string
  accent: string
  accentForeground: string
  ring: string

  charts: [string, string, string, string, string]
}

export function deriveTheme(config: ThemeConfig): DerivedTheme {
  const topbar = config.topbar.background
  const sidebar = config.sidebar.background
  const primary = config.primary.color

  const sidebarDark = isDark(sidebar)
  const sidebarFg = readableForeground(sidebar)

  const accentBase = adjustSaturation(rotateHue(primary, 32), 0.05)
  const accent = isDark(accentBase)
    ? mix(accentBase, "#ffffff", 0.12)
    : mix(accentBase, "#ffffff", 0.78)

  return {
    topbarBackground: topbar,
    topbarForeground: readableForeground(topbar),
    topbarBorder: mix(topbar, isDark(topbar) ? "#ffffff" : "#000000", 0.12),

    sidebarBackground: sidebar,
    sidebarForeground: sidebarFg,
    sidebarMutedForeground: mix(sidebarFg, sidebar, 0.35),
    sidebarHover: mix(sidebar, sidebarDark ? "#ffffff" : "#000000", 0.07),
    sidebarHoverForeground: sidebarFg,
    sidebarActive: mix(sidebar, primary, sidebarDark ? 0.42 : 0.16),
    sidebarActiveForeground: readableForeground(
      mix(sidebar, primary, sidebarDark ? 0.42 : 0.16)
    ),
    sidebarBorder: mix(sidebar, sidebarDark ? "#ffffff" : "#000000", 0.12),

    primary,
    primaryForeground: readableForeground(primary),
    primaryHover: hoverVariant(primary, 0.07),
    accent,
    accentForeground: readableForeground(accent),
    ring: hslToHex({ ...hexToHsl(primary), l: isDark(primary) ? 0.55 : 0.62 }),

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

function toDarkChartVariant(hex: string): string {
  if (!isDark(hex)) return hex
  const hsl = hexToHsl(hex)
  const brightened =
    hsl.l < 0.35 ? hslToHex({ ...hsl, l: clamp(hsl.l + 0.14) }) : hex
  return adjustSaturation(brightened, 0.03)
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
  return {
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
    "--sidebar-ring": d.ring,

    "--primary": d.primary,
    "--primary-foreground": d.primaryForeground,
    "--primary-hover": d.primaryHover,
    "--accent": d.accent,
    "--accent-foreground": d.accentForeground,
    "--ring": d.ring,

    "--chart-1": d.charts[0],
    "--chart-2": d.charts[1],
    "--chart-3": d.charts[2],
    "--chart-4": d.charts[3],
    "--chart-5": d.charts[4],
  }
}

export function applyThemeToElement(
  config: ThemeConfig,
  element: HTMLElement
): void {
  const vars = themeToCssVars(config)
  for (const [key, value] of Object.entries(vars)) {
    element.style.setProperty(key, value)
  }
}

export function clearThemeFromElement(
  element: HTMLElement,
  config: ThemeConfig
): void {
  for (const key of Object.keys(themeToCssVars(config))) {
    element.style.removeProperty(key)
  }
}
