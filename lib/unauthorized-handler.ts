import { QueryClient } from "@tanstack/react-query"

import { clearSessionCookie } from "@/lib/session"
import { notifySessionEnded, postSessionMessage } from "@/lib/session-bus"
import { resetServerClock } from "@/lib/server-clock"
import { useAccessStore } from "@/stores/access-store"
import { useAuthStore } from "@/stores/auth-store"

let globalQueryClient: QueryClient | null = null

export function setGlobalQueryClient(client: QueryClient) {
  globalQueryClient = client
}

export function getGlobalQueryClient(): QueryClient | null {
  return globalQueryClient
}

export type RedirectRequest = {
  target: string
  variant: "loading" | "logout"
}

let pendingRedirect: RedirectRequest | null = null
const redirectListeners = new Set<() => void>()

function emitRedirect() {
  for (const listener of redirectListeners) {
    listener()
  }
}

function requestRedirect(request: RedirectRequest) {
  pendingRedirect = request
  emitRedirect()
}

export { requestRedirect }

export function subscribeRedirects(listener: () => void): () => void {
  redirectListeners.add(listener)

  return () => {
    redirectListeners.delete(listener)
  }
}

export function getRedirectRequest(): RedirectRequest | null {
  return pendingRedirect
}

export function clearRedirectRequest(): void {
  pendingRedirect = null
  emitRedirect()
}

function alreadyOnLogin(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/login")
  )
}

/**
 * 401 / expired session: stop tracking, clear every local trace, notify other
 * tabs, and route to login client-side (no full page reload).
 *
 * A fresh login always starts at the dashboard — we deliberately do not carry
 * a `returnTo` target after a logout/expiry.
 */
export function handleUnauthorized(options?: { broadcast?: boolean }): void {
  const { broadcast = true } = options ?? {}
  const session = useAuthStore.getState().session

  // Nothing to clear, or a concurrent 401 already handled it.
  if (!session) {
    return
  }

  notifySessionEnded()
  useAuthStore.getState().clearSession()
  useAccessStore.getState().clearAccess()
  clearSessionCookie()
  globalQueryClient?.clear()
  resetServerClock()

  if (broadcast) {
    postSessionMessage({ type: "session-ended" })
  }

  if (!alreadyOnLogin()) {
    requestRedirect({
      target: "/login",
      variant: "logout",
    })
  }
}

/**
 * 403 PASSWORD_CHANGE_REQUIRED: keep the token, stop renewal, and route to the
 * change-password screen. Never log out and never retry the denied request.
 */
export function handlePasswordChangeRequired(): void {
  useAuthStore.getState().setMustChangePassword(true)

  if (
    typeof window !== "undefined" &&
    window.location.pathname !== "/change-password"
  ) {
    requestRedirect({ target: "/change-password", variant: "loading" })
  }
}
