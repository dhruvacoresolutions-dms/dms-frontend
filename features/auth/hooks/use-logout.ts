"use client"

import { useCallback, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/stores/auth-store"
import { useAccessStore } from "@/stores/access-store"
import { clearSessionCookie } from "@/lib/session"

export function useLogout() {
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

    // Give the "Logging you out…" screen a frame to paint before we tear
    // down session state and trigger the full-page navigation. The logout
    // overlay renders at z-[60], above the RouteGate "Loading..." fallback
    // (z-50) that appears once access is cleared, so it stays on top until
    // the login page loads.
    await new Promise((resolve) => setTimeout(resolve, 450))

    clearSession()
    clearAccess()
    clearSessionCookie()
    queryClient.clear()
    window.location.assign("/auth/login")
  }, [clearSession, clearAccess, queryClient])

  return { logout, isLoggingOut }
}
