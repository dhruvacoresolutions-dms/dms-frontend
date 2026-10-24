"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import { logoutSession } from "@/features/auth/api/auth.api"
import { notifySessionEnded, postSessionMessage } from "@/lib/session-bus"
import { clearSessionCookie } from "@/lib/session"
import { useAccessStore } from "@/stores/access-store"
import { useAuthStore } from "@/stores/auth-store"

export function useLogout() {
  const router = useRouter()
  const clearSession = useAuthStore((state) => state.clearSession)
  const clearAccess = useAccessStore((state) => state.clearAccess)
  const queryClient = useQueryClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const inFlightRef = useRef(false)

  const logout = useCallback(async () => {
    // Guard against double-clicks while the logout screen is up.
    if (inFlightRef.current) return
    inFlightRef.current = true
    setIsLoggingOut(true)

    // Capture before clearing: the request interceptor reads the token from
    // the store, and the store is cleared first by design.
    const accessToken = useAuthStore.getState().session?.accessToken

    notifySessionEnded()
    clearSession()
    clearAccess()
    clearSessionCookie()
    queryClient.clear()
    postSessionMessage({ type: "session-ended" })

    // Fire-and-forget: revoke server-side, but never block the UI on it.
    void logoutSession(accessToken)

    // Let the "Logging you out…" overlay paint before navigating.
    await new Promise((resolve) => setTimeout(resolve, 450))

    router.replace("/auth/login")
  }, [clearSession, clearAccess, queryClient, router])

  return { logout, isLoggingOut }
}
