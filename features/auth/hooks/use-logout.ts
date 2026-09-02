"use client"

import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/stores/auth-store"
import { useAccessStore } from "@/stores/access-store"
import { clearSessionCookie } from "@/lib/session"

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession)
  const clearAccess = useAccessStore((state) => state.clearAccess)
  const queryClient = useQueryClient()

  const logout = useCallback(() => {
    clearSession()
    clearAccess()
    clearSessionCookie()
    queryClient.clear()
    window.location.assign("/auth/login")
  }, [clearSession, clearAccess, queryClient])

  return { logout }
}
