"use client"

import { useCallback } from "react"

import { useAuthStore } from "@/stores/auth-store"
import { clearSessionCookie } from "@/lib/session"

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession)

  const logout = useCallback(() => {
    clearSession()
    clearSessionCookie()
    window.location.assign("/auth/login")
  }, [clearSession])

  return { logout }
}
