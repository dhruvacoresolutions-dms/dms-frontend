"use client"

import { useEffect, useState } from "react"

import { serverNow } from "@/lib/server-clock"
import { useAuthStore } from "@/stores/auth-store"

/**
 * Countdown derived from the server-provided `expiresAt`. This is presentation
 * only — renewal is still interaction-driven.
 */
export function useSessionCountdown() {
  const expiresAt = useAuthStore((state) => state.session?.expiresAt) ?? null
  const [now, setNow] = useState(() => serverNow())

  useEffect(() => {
    if (!expiresAt) {
      return
    }

    const timer = setInterval(() => setNow(serverNow()), 1000)

    return () => clearInterval(timer)
  }, [expiresAt])

  return {
    expiresAt,
    remainingMs: expiresAt ? Math.max(0, expiresAt - now) : 0,
  }
}

export function formatSessionTime(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
