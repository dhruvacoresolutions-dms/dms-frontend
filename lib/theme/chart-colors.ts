"use client"

import { useSyncExternalStore } from "react"

/**
 * Canonical chart palette.
 *
 * Rule: chart colors ALWAYS come from CSS variables —
 * - default: `globals.css` `:root` / `.dark` `--chart-1..5`
 * - preset selected: that preset's chart palette (applied to the same
 *   `--chart-1..5` vars by `DynamicThemeProvider` / `ThemeInitScript`)
 *
 * Never hardcode chart hex/oklch values in chart components. Use these
 * `var(--chart-*)` references so charts follow the active theme/preset.
 */

export const CHART_CSS_VARS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
] as const

export type ChartCssVar = (typeof CHART_CSS_VARS)[number]

/** `var(--chart-N)` references — use directly in SVG `fill`/`stroke` or chart libs. */
export const CHART_COLORS: Record<number, string> = {
  1: "var(--chart-1)",
  2: "var(--chart-2)",
  3: "var(--chart-3)",
  4: "var(--chart-4)",
  5: "var(--chart-5)",
}

/** 1-based accessor with wrap-around, e.g. `chartColor(6) === chartColor(1)`. */
export function chartColor(index: number): string {
  const normalized = ((index - 1) % CHART_CSS_VARS.length + CHART_CSS_VARS.length) % CHART_CSS_VARS.length
  return `var(${CHART_CSS_VARS[normalized]})`
}

/** Tailwind classes wired to the same vars (`bg-chart-1`, `fill-chart-2`, …). */
export function chartClass(index: number, utility = "bg"): string {
  const normalized = ((index - 1) % 5 + 5) % 5 + 1
  return `${utility}-chart-${normalized}`
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  // Re-read when theme vars change (preset switch / mode toggle mutate
  // inline styles on <html>; MutationObserver catches that cheaply).
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style", "class"],
  })
  window.addEventListener("storage", callback)
  return () => {
    observer.disconnect()
    window.removeEventListener("storage", callback)
  }
}

function readResolvedChartColors(): [string, string, string, string, string] {
  if (typeof window === "undefined") {
    return ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
  }
  const computed = getComputedStyle(document.documentElement)
  return [1, 2, 3, 4, 5].map((i) => {
    const value = computed.getPropertyValue(`--chart-${i}`).trim()
    return value || `var(--chart-${i})`
  }) as [string, string, string, string, string]
}

/**
 * Resolved `--chart-1..5` values for canvas-based chart libs that can't
 * consume `var()` directly. Re-reads on theme/preset/mode change.
 */
export function useChartColors(): [string, string, string, string, string] {
  return useSyncExternalStore(
    subscribe,
    readResolvedChartColors,
    () =>
      ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"] as [
        string,
        string,
        string,
        string,
        string,
      ]
  )
}
