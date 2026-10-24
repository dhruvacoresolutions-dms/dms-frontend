"use client"

import { ClockIcon } from "lucide-react"

import {
  formatSessionTime,
  useSessionCountdown,
} from "@/features/auth/hooks/use-session-countdown"
import { useAuthStore } from "@/stores/auth-store"

/**
 * Compact, always-visible countdown from the server `expiresAt`. The T-2
 * minute "Stay signed in" banner takes over when action is needed.
 */
export function SessionCountdown() {
  const session = useAuthStore((state) => state.session)
  const { remainingMs } = useSessionCountdown()

  if (!session?.accessToken || session.mustChangePassword || remainingMs <= 0) {
    return null
  }

  return (
    <div
      className="hidden items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-topbar-foreground/80 sm:flex"
      title="Session time remaining"
      aria-label={`Session time remaining: ${formatSessionTime(remainingMs)}`}
    >
      <ClockIcon className="size-3.5" aria-hidden />
      <span className="font-mono tabular-nums">
        {formatSessionTime(remainingMs)}
      </span>
    </div>
  )
}
