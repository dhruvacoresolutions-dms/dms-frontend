"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuthStore } from "@/stores/auth-store"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((state) => state.session)
  const router = useRouter()

  useEffect(() => {
    // The first client render uses the SSR snapshot (`session: null`) until
    // `persist` rehydrates from localStorage. Waiting avoids redirecting a
    // valid session to login on every hard reload.
    if (!useAuthStore.persist.hasHydrated()) {
      return
    }

    if (useAuthStore.getState().session) {
      return
    }

    router.replace("/login")
  }, [session, router])

  if (!session) {
    return null
  }

  return <>{children}</>
}