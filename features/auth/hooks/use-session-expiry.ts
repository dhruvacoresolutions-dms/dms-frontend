"use client"

import { useEffect, useRef } from "react"
import { useAuthStore, isSessionExpired } from "@/stores/auth-store"
import { handleUnauthorized } from "@/lib/unauthorized-handler"
import { hasSessionCookie } from "@/lib/session"

/**
 * Proactively logs out when BE session expires.
 * - Schedules a timer based on `session.expiresAt` (computed from `expiresIn`).
 * - Re-checks on tab visibility / focus and on mount.
 * - Handles desync where cookie expired but zustand persist still holds session.
 *
 * BE is source of truth: 401 interceptor already calls handleUnauthorized().
 * This hook covers the idle case where no API call triggers 401 and the
 * cookie's max-age has elapsed.
 */
export function useSessionExpiry() {
  const session = useAuthStore((s) => s.session)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function clearTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    function checkAndExpire(reason: string) {
      if (!session) return false
      const expired = isSessionExpired(session)
      const cookieMissing = !hasSessionCookie()
      // If session in store but cookie gone -> proxy would redirect, but store still stale
      // Treat as expired to avoid flicker / stale UI
      if (expired || (cookieMissing && !!session.accessToken)) {
        // Only auto-expire if actually time-expired OR cookie desync.
        // For cookie desync, wait until we are sure it's not a transient write.
        if (expired) {
          console.debug(`[session] expired (${reason}), clearing`)
          handleUnauthorized()
          return true
        }
        // Cookie missing but not yet time-expired: could be manual deletion or BE timeout
        // that cleared cookie but not store (e.g., proxy path). Still purge.
        // We debounce 0 to avoid clearing during login race where cookie write hasn't flushed
        if (cookieMissing && !expired) {
          // If session was just created (<2s ago) don't purge — login race
          const ageMs = Date.now() - (session.expiresAt - session.expiresIn * 1000)
          if (ageMs > 2000) {
            console.debug(`[session] cookie missing desync (${reason}), clearing`)
            handleUnauthorized()
            return true
          }
        }
      }
      return false
    }

    clearTimer()

    if (!session) return clearTimer

    if (checkAndExpire("mount")) return

    const delay = session.expiresAt - Date.now()
    if (delay <= 0) {
      handleUnauthorized()
      return
    }

    // Small safety buffer: expire 1s early to avoid race with BE
    const timeoutMs = Math.max(0, delay - 1000)
    timerRef.current = setTimeout(() => {
      handleUnauthorized()
    }, timeoutMs)

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        checkAndExpire("visibility")
      }
    }
    const onFocus = () => checkAndExpire("focus")

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", onFocus)

    return () => {
      clearTimer()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", onFocus)
    }
  }, [session])
}
