import type { ThemeConfig } from "./types"

export const DEFAULT_THEME: ThemeConfig = {
  topbar: { background: "#ffffff" },
  sidebar: { background: "#f8fafc" },
  primary: { color: "#1d283a" },
  charts: {
    chart1: "#e76e50",
    chart2: "#2a9d90",
    chart3: "#274754",
    chart4: "#e8c468",
    chart5: "#f4a462",
  },
}

export const THEME_PRESETS: { id: string; name: string; theme: ThemeConfig }[] = [
  { id: "default", name: "Slate", theme: DEFAULT_THEME },
  {
    id: "ocean",
    name: "Ocean",
    theme: {
      topbar: { background: "#0f172a" },
      sidebar: { background: "#0b3a5c" },
      primary: { color: "#0284c7" },
      charts: {
        chart1: "#0284c7",
        chart2: "#38bdf8",
        chart3: "#1e40af",
        chart4: "#7dd3fc",
        chart5: "#0c4a6e",
      },
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    theme: {
      topbar: { background: "#ecfdf5" },
      sidebar: { background: "#064e3b" },
      primary: { color: "#059669" },
      charts: {
        chart1: "#059669",
        chart2: "#34d399",
        chart3: "#0f766e",
        chart4: "#a7f3d0",
        chart5: "#065f46",
      },
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    theme: {
      topbar: { background: "#431407" },
      sidebar: { background: "#7c2d12" },
      primary: { color: "#ea580c" },
      charts: {
        chart1: "#ea580c",
        chart2: "#f59e0b",
        chart3: "#dc2626",
        chart4: "#fbbf24",
        chart5: "#9a3412",
      },
    },
  },
]
