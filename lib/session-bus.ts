/**
 * Cross-tab session channel.
 *
 * One tab renews at a time (see `session-tracker.ts`); the renewed token is
 * broadcast so every other tab adopts the same session. Logout/expiry is also
 * broadcast so tabs do not keep showing a dead session.
 */
export type SessionBusMessage =
  | {
      type: "session-renewed"
      accessToken: string
      expiresAt: number
      expiresIn: number
      renewedAt: number
    }
  | { type: "session-ended" }

const CHANNEL_NAME = "dms-auth"

let channel: BroadcastChannel | null = null
let sessionEndedHandler: (() => void) | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null
  }

  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME)
  }

  return channel
}

export function postSessionMessage(message: SessionBusMessage): void {
  try {
    getChannel()?.postMessage(message)
  } catch {
    // BroadcastChannel is best-effort (unsupported or closed).
  }
}

export function subscribeSessionMessages(
  handler: (message: SessionBusMessage) => void
): () => void {
  const bus = getChannel()

  if (!bus) {
    return () => {}
  }

  const listener = (event: MessageEvent<SessionBusMessage>) => {
    if (event.data && typeof event.data === "object") {
      handler(event.data)
    }
  }

  bus.addEventListener("message", listener)

  return () => bus.removeEventListener("message", listener)
}

/**
 * Registered by the tracker so `handleUnauthorized` can stop it without a
 * circular import.
 */
export function registerSessionEndedHandler(handler: () => void): void {
  sessionEndedHandler = handler
}

export function notifySessionEnded(): void {
  sessionEndedHandler?.()
}
