const SESSION_COOKIE = "session"

export function setSessionCookie(token: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") {
    return
  }

  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`
}

export function clearSessionCookie() {
  if (typeof document === "undefined") {
    return
  }

  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`
}