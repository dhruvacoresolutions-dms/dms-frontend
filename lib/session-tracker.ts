"use client"

import { getApiError } from "@/lib/api/api-error"
import {
  handleUnauthorized,
} from "@/lib/unauthorized-handler"
import {
  postSessionMessage,
  registerSessionEndedHandler,
  subscribeSessionMessages,
  type SessionBusMessage,
} from "@/lib/session-bus"
import { serverNow } from "@/lib/server-clock"
import { setSessionCookieUntil } from "@/lib/session"
import {
  isRenewableSession,
  useAuthStore,
  type AuthSession,
  type SessionTokenUpdate,
} from "@/stores/auth-store"
import { renewSessionActivity } from "@/features/auth/api/auth.api"

/** Minimum time between two successful renewals (client policy). */
const RENEWAL_MIN_INTERVAL_MS = 5 * 60 * 1000
/** Back off after a transient renewal failure. */
const FAILURE_BACKOFF_MS = 30 * 1000
/** Collapse bursty keydown/click events into one check per second. */
const INTERACTION_DEBOUNCE_MS = 1_000
/** setTimeout overflows beyond 2^31-1 ms. */
const MAX_TIMEOUT_MS = 2_147_483_647
const RENEWAL_LOCK_NAME = "dms-session-renewal"

let started = false
let expiryTimer: ReturnType<typeof setTimeout> | null = null
let unsubscribeBus: (() => void) | null = null
let lastRenewedAt = 0
let lastFailureAt = 0
let lastHandledInteractionAt = 0
let renewalInFlight: Promise<void> | null = null

function currentSession(): AuthSession | null {
  return useAuthStore.getState().session
}

function clearExpiryTimer() {
  if (expiryTimer) {
    clearTimeout(expiryTimer)
    expiryTimer = null
  }
}

/**
 * Local expiry guard. Renewal is interaction-driven; this timer only enforces
 * the server-provided `expiresAt` when the tab sits idle.
 */
function armExpiryTimer() {
  clearExpiryTimer()

  const session = currentSession()

  if (!session) {
    return
  }

  const delay = session.expiresAt - serverNow()

  if (delay <= 0) {
    handleUnauthorized()
    return
  }

  expiryTimer = setTimeout(() => {
    const latest = currentSession()

    if (!latest || latest.expiresAt <= serverNow()) {
      handleUnauthorized()
      return
    }

    armExpiryTimer()
  }, Math.min(delay, MAX_TIMEOUT_MS))
}

function applyRenewal(renewal: SessionTokenUpdate) {
  const session = currentSession()

  if (!session) {
    return
  }

  lastRenewedAt = renewal.renewedAt ?? serverNow()
  lastFailureAt = 0

  useAuthStore.getState().updateSessionToken(renewal)
  setSessionCookieUntil(renewal.accessToken, renewal.expiresAt)
  armExpiryTimer()

  postSessionMessage({
    type: "session-renewed",
    accessToken: renewal.accessToken,
    expiresAt: renewal.expiresAt,
    expiresIn: renewal.expiresIn ?? session.expiresIn,
    renewedAt: lastRenewedAt,
  })
}

/**
 * Only one tab renews at a time. Other tabs adopt the token through the
 * BroadcastChannel instead of issuing a second renewal.
 */
async function withLeaderLock(task: () => Promise<void>): Promise<void> {
  const locks = (navigator as Navigator & { locks?: LockManager }).locks

  if (!locks?.request) {
    await task()
    return
  }

  await locks.request(
    RENEWAL_LOCK_NAME,
    { ifAvailable: true },
    async (lock) => {
      if (!lock) {
        return
      }

      await task()
    }
  )
}

function getErrorStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status
}

async function performRenewal(
  force: boolean,
  tokenAtStart: string
): Promise<void> {
  try {
    await withLeaderLock(async () => {
      const latest = currentSession()

      // Another tab renewed or the session was cleared while waiting.
      if (!latest || latest.accessToken !== tokenAtStart) {
        return
      }

      if (!force && serverNow() - lastRenewedAt < RENEWAL_MIN_INTERVAL_MS) {
        return
      }

      const renewal = await renewSessionActivity()

      // Epoch guard: never resurrect a session that ended mid-flight.
      if (currentSession()?.accessToken !== tokenAtStart) {
        return
      }

      applyRenewal(renewal)
    })
  } catch (error) {
    const status = getErrorStatus(error)
    const code = getApiError(error)?.code

    if (status === 401 || (status === 403 && code === "ACCESS_DENIED")) {
      handleUnauthorized()
      return
    }

    if (status === 403 && code === "PASSWORD_CHANGE_REQUIRED") {
      useAuthStore.getState().setMustChangePassword(true)
      return
    }

    // Transient failure: keep the session, retry after a short backoff.
    lastFailureAt = serverNow()
  }
}

function renew(force = false): Promise<void> {
  if (renewalInFlight) {
    return renewalInFlight
  }

  const session = currentSession()

  if (!session?.accessToken) {
    return Promise.resolve()
  }

  if (serverNow() >= session.expiresAt) {
    handleUnauthorized()
    return Promise.resolve()
  }

  if (session.mustChangePassword) {
    return Promise.resolve()
  }

  // Platform tokens are stateless; the renewal endpoint rejects them.
  if (!isRenewableSession(session)) {
    return Promise.resolve()
  }

  if (!force) {
    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      return Promise.resolve()
    }

    if (serverNow() - lastRenewedAt < RENEWAL_MIN_INTERVAL_MS) {
      return Promise.resolve()
    }

    if (lastFailureAt && serverNow() - lastFailureAt < FAILURE_BACKOFF_MS) {
      return Promise.resolve()
    }
  }

  const tokenAtStart = session.accessToken

  renewalInFlight = performRenewal(force, tokenAtStart).finally(() => {
    renewalInFlight = null
  })

  return renewalInFlight
}

function onInteraction() {
  const now = serverNow()

  // Bursty keydown/click events: one evaluation per second is plenty.
  if (now - lastHandledInteractionAt < INTERACTION_DEBOUNCE_MS) {
    return
  }

  lastHandledInteractionAt = now
  void renew()
}

function onVisibilityChange() {
  if (document.visibilityState !== "visible") {
    return
  }

  const session = currentSession()

  if (!session) {
    return
  }

  if (serverNow() >= session.expiresAt) {
    handleUnauthorized()
    return
  }

  // Re-arm in case the tab was suspended (timers can be coalesced).
  armExpiryTimer()
}

function onBusMessage(message: SessionBusMessage) {
  if (message.type === "session-ended") {
    handleUnauthorized({ broadcast: false })
    return
  }

  if (message.type !== "session-renewed") {
    return
  }

  const session = currentSession()

  if (!session) {
    return
  }

  // Only adopt a token that lives longer than ours (and is actually new).
  if (
    message.accessToken === session.accessToken ||
    message.expiresAt <= session.expiresAt
  ) {
    return
  }

  lastRenewedAt = message.renewedAt
  lastFailureAt = 0
  useAuthStore.getState().updateSessionToken({
    accessToken: message.accessToken,
    expiresAt: message.expiresAt,
    expiresIn: message.expiresIn,
    renewedAt: message.renewedAt,
  })
  setSessionCookieUntil(message.accessToken, message.expiresAt)
  armExpiryTimer()
}

/**
 * Start listening for real user activity. Renewal is never timer-driven:
 * clicks, key presses, touches and form submits only.
 */
export function startSessionTracker(): void {
  if (started || typeof window === "undefined") {
    return
  }

  started = true
  lastHandledInteractionAt = 0
  lastFailureAt = 0
  lastRenewedAt = currentSession()?.renewedAt ?? 0

  document.addEventListener("click", onInteraction, true)
  document.addEventListener("keydown", onInteraction, true)
  document.addEventListener("touchstart", onInteraction, {
    capture: true,
    passive: true,
  })
  document.addEventListener("submit", onInteraction, true)
  document.addEventListener("visibilitychange", onVisibilityChange)

  unsubscribeBus = subscribeSessionMessages(onBusMessage)
  armExpiryTimer()
}

export function stopSessionTracker(): void {
  if (!started) {
    return
  }

  started = false
  clearExpiryTimer()

  document.removeEventListener("click", onInteraction, true)
  document.removeEventListener("keydown", onInteraction, true)
  document.removeEventListener("touchstart", onInteraction, true)
  document.removeEventListener("submit", onInteraction, true)
  document.removeEventListener("visibilitychange", onVisibilityChange)

  unsubscribeBus?.()
  unsubscribeBus = null
}

/**
 * Explicit "Stay signed in" action. Bypasses the 5-minute throttle because
 * the click itself is proof of presence, but still honours single-flight.
 */
export function renewSessionNow(): Promise<void> {
  lastFailureAt = 0
  return renew(true)
}

// `handleUnauthorized` can stop the tracker without importing this module.
registerSessionEndedHandler(stopSessionTracker)
