"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Renders a form label with a red required marker.
 *
 * Use for every field the backend rejects when missing (i.e. a field backed by
 * `@NotBlank` / `@NotNull` or a mandatory product field template entry).
 */
export function requiredLabel(
  label: React.ReactNode,
  required = true,
  className?: string
) {
  if (!required) return label
  return (
    <>
      {label}
      <span
        aria-hidden="true"
        className={cn("text-destructive", className)}
        data-required="true"
      >
        *
      </span>
    </>
  )
}
