"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import { DEFAULT_ACCENT, type Accent } from "@/lib/accents"

type AccentState = {
  accent: Accent
  setAccent: (accent: Accent) => void
}

export const useAccentStore = create<AccentState>()(
  persist(
    (set) => ({
      accent: DEFAULT_ACCENT,
      setAccent: (accent) => set({ accent }),
    }),
    { name: "dms-accent" }
  )
)
