/**
 * Server-authoritative clock.
 *
 * The backend returns absolute expiry timestamps (`expiresAt`) plus a
 * response-envelope `timestamp`. We track the offset between the server and
 * this browser so countdowns and expiry checks never depend on a correctly
 * configured client clock.
 */
let offsetMs = 0

export function syncServerClock(serverTimestamp?: string | null): void {
  if (!serverTimestamp) {
    return
  }

  const parsed = Date.parse(serverTimestamp)

  if (Number.isNaN(parsed)) {
    return
  }

  offsetMs = parsed - Date.now()
}

export function getServerOffsetMs(): number {
  return offsetMs
}

/** Current time on the server's clock, in epoch milliseconds. */
export function serverNow(): number {
  return Date.now() + offsetMs
}

export function resetServerClock(): void {
  offsetMs = 0
}
