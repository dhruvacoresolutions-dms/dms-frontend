"use client"

import * as React from "react"

import { useAccentStore } from "@/stores/accent-store"

export function AccentThemeProvider() {
  const accent = useAccentStore((state) => state.accent)

  React.useEffect(() => {
    document.documentElement.dataset.accent = accent
  }, [accent])

  return null
}
