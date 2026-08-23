"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type NavigationLayout = "sidebar" | "topnav"

type NavigationState = {
  layout: NavigationLayout
  setLayout: (layout: NavigationLayout) => void
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      layout: "sidebar",
      setLayout: (layout) => set({ layout }),
    }),
    { name: "dms-navigation-layout" }
  )
)
