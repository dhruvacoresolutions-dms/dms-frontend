/**
 * Read the `exp` claim from a JWT without verifying it.
 *
 * Used only as a fallback when an endpoint returns a token but no
 * `expiresAt` (for example `POST /auth/change-password`). Response-provided
 * expiry always wins over this value.
 */
export function getJwtExpiryMs(token?: string | null): number | null {
  if (!token) {
    return null
  }

  const parts = token.split(".")

  if (parts.length < 2) {
    return null
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    )
    const payload = JSON.parse(atob(padded)) as { exp?: unknown }

    return typeof payload.exp === "number" ? payload.exp * 1000 : null
  } catch {
    return null
  }
}
