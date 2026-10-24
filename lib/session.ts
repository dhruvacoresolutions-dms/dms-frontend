import { serverNow } from "@/lib/server-clock"

const SESSION_COOKIE = "session"

export function setSessionCookie(token: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") {
    return
  }

  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`
}

/**
 * Cookie lifetime must follow the server's `expiresAt`, not a hardcoded
 * `expiresIn`. The cookie is only a presence flag for the Next middleware.
 */
export function setSessionCookieUntil(token: string, expiresAt: number) {
  const seconds = Math.max(0, Math.floor((expiresAt - serverNow()) / 1000))
  setSessionCookie(token, seconds)
}

export function clearSessionCookie() {
  if (typeof document === "undefined") {
    return
  }

  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`
}

export function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false
  return document.cookie.split("; ").some((c) => c.startsWith(`${SESSION_COOKIE}=`) && c.split("=")[1])
}
