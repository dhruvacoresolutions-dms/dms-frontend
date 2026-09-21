"use client"

import { Loader2 } from "lucide-react"

export type AuthLoadingVariant = "login" | "loading" | "logout"

const VARIANT_COPY: Record<AuthLoadingVariant, { title: string; message: string }> = {
  login: {
    title: "Signing you in…",
    message: "Setting up your workspace…",
  },
  loading: {
    title: "Loading...",
    message: "Just a moment…",
  },
  logout: {
    title: "Logging you out…",
    message: "See you soon…",
  },
}

export function AuthLoadingScreen({
  variant = "loading",
  title,
  message,
}: {
  /**
   * - `login`: shown right after a successful login (permissions fetch).
   * - `loading`: shown on page refresh / access rehydration (neutral copy).
   * - `logout`: shown while the session is being cleared.
   */
  variant?: AuthLoadingVariant
  title?: string
  message?: string
}) {
  const copy = VARIANT_COPY[variant]

  return (
    <div
      role="status"
      aria-live="polite"
      data-variant={variant}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background"
    >
      <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="shimmer text-base font-semibold">
          {title ?? copy.title}
        </p>
        <p className="text-sm text-muted-foreground">{message ?? copy.message}</p>
      </div>
    </div>
  )
}
