import { useAuthStore } from "@/stores/auth-store"
import { clearSessionCookie } from "@/lib/session"

const AUTH_PREFIX = "/auth/"

let redirecting = false

export function handleUnauthorized() {
  useAuthStore.getState().clearSession()
  clearSessionCookie()

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