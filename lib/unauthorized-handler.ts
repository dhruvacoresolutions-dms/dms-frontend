import { useAuthStore } from "@/stores/auth-store"
import { useAccessStore } from "@/stores/access-store"
import { clearSessionCookie } from "@/lib/session"
import { QueryClient } from "@tanstack/react-query"

let globalQueryClient: QueryClient | null = null

export function setGlobalQueryClient(client: QueryClient) {
  globalQueryClient = client
}

const AUTH_PREFIX = "/auth/"

let redirecting = false

export function handleUnauthorized() {
  useAuthStore.getState().clearSession()
  useAccessStore.getState().clearAccess()
  clearSessionCookie()
  globalQueryClient?.clear()

  if (typeof window === "undefined") {
    return
  }

  const { pathname } = window.location

  if (pathname.startsWith(AUTH_PREFIX)) {
    return
  }

  if (redirecting) {
    return
  }

  redirecting = true

  const loginUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`
  window.location.assign(loginUrl)
}