"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  formatSessionTime,
  useSessionCountdown,
} from "@/features/auth/hooks/use-session-countdown"
import { useLogout } from "@/features/auth/hooks/use-logout"
import { renewSessionNow } from "@/lib/session-tracker"
import { isRenewableSession, useAuthStore } from "@/stores/auth-store"

/** Show the warning during the last two minutes of the session. */
const WARNING_WINDOW_MS = 2 * 60 * 1000

/**
 * T-2 minute warning with an explicit "Stay signed in" action. The click is
 * real proof of presence, so it renews immediately (bypassing the normal
 * interaction throttle).
 */
export function SessionExpiryBanner() {
  const session = useAuthStore((state) => state.session)
  const { remainingMs } = useSessionCountdown()
  const { logout, isLoggingOut } = useLogout()
  const [isRenewing, setIsRenewing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (
    !session?.accessToken ||
    session.mustChangePassword ||
    !isRenewableSession(session)
  ) {
    return null
  }

  if (remainingMs <= 0 || remainingMs > WARNING_WINDOW_MS) {
    return null
  }

  async function handleStaySignedIn() {
    const before = useAuthStore.getState().session?.expiresAt ?? 0

    setIsRenewing(true)
    setMessage(null)

    try {
      await renewSessionNow()
      // Give a leader-tab broadcast a moment to land before judging success.
      await new Promise((resolve) => setTimeout(resolve, 300))

      const after = useAuthStore.getState().session?.expiresAt ?? 0

      if (after <= before) {
        setMessage(
          "We couldn't extend your session. Save your work and sign in again."
        )
      }
    } finally {
      setIsRenewing(false)
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 bottom-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-card p-4 text-card-foreground shadow-lg"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">Your session is about to expire</p>
          <p className="text-xs text-muted-foreground">
            You will be signed out in{" "}
            <span className="font-mono font-medium text-foreground">
              {formatSessionTime(remainingMs)}
            </span>
            .
          </p>
          {message && (
            <p className="text-xs text-destructive" role="alert">
              {message}
            </p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={logout}
            disabled={isLoggingOut || isRenewing}
          >
            Sign out
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleStaySignedIn}
            disabled={isRenewing || isLoggingOut}
          >
            {isRenewing ? "Extending..." : "Stay signed in"}
          </Button>
        </div>
      </div>
    </div>
  )
}
