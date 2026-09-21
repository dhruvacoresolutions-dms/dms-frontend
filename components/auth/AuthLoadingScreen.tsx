"use client"

import { Loader2 } from "lucide-react"

export function AuthLoadingScreen({
  title = "Signing you in…",
  message = "Just a moment…",
}: {
  title?: string
  message?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background"
    >
      <Loader2 className="size-10 animate-spin text-primary" />
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-base font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
