export type Accent =
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "pink"
  | "rose"
  | "red"
  | "orange"
  | "amber"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"

export type AccentOption = {
  id: Accent
  label: string
  swatch: string
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: "blue", label: "Blue", swatch: "oklch(0.488 0.243 264.376)" },
  { id: "indigo", label: "Indigo", swatch: "oklch(0.47 0.27 253)" },
  { id: "violet", label: "Violet", swatch: "oklch(0.49 0.27 277)" },
  { id: "purple", label: "Purple", swatch: "oklch(0.49 0.26 288)" },
  { id: "pink", label: "Pink", swatch: "oklch(0.55 0.25 330)" },
  { id: "rose", label: "Rose", swatch: "oklch(0.53 0.24 357)" },
  { id: "red", label: "Red", swatch: "oklch(0.52 0.23 25)" },
  { id: "orange", label: "Orange", swatch: "oklch(0.6 0.2 45)" },
  { id: "amber", label: "Amber", swatch: "oklch(0.76 0.15 75)" },
  { id: "green", label: "Green", swatch: "oklch(0.55 0.16 140)" },
  { id: "emerald", label: "Emerald", swatch: "oklch(0.58 0.16 165)" },
  { id: "teal", label: "Teal", swatch: "oklch(0.58 0.12 190)" },
  { id: "cyan", label: "Cyan", swatch: "oklch(0.7 0.14 212)" },
]

export const DEFAULT_ACCENT: Accent = "blue"

export function getAccentOption(id: Accent) {
  return ACCENT_OPTIONS.find((option) => option.id === id) ?? ACCENT_OPTIONS[0]
}
