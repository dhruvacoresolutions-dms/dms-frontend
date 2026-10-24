import { format, isValid, parseISO } from "date-fns"

/** Placeholder used consistently across detail views and tables. */
export const EMPTY_VALUE = "—"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** True when a value looks like a UUID (with or without upper-case hex). */
export function isUuid(value?: string | null): boolean {
  return !!value && UUID_PATTERN.test(value.trim())
}

function toValidDate(value?: string | Date | null): Date | null {
  if (!value) return null
  const parsed = value instanceof Date ? value : parseISO(value)
  return isValid(parsed) ? parsed : null
}

/** Render a date (or ISO timestamp) as `dd MMM yyyy`. */
export function formatDate(value?: string | Date | null): string {
  const parsed = toValidDate(value)
  return parsed ? format(parsed, "dd MMM yyyy") : EMPTY_VALUE
}

/** Render a timestamp as `dd MMM yyyy, hh:mm a`. */
export function formatDateTime(value?: string | Date | null): string {
  const parsed = toValidDate(value)
  return parsed ? format(parsed, "dd MMM yyyy, hh:mm a") : EMPTY_VALUE
}

/** Render a date range with an arrow; missing endpoints become `—`. */
export function formatDateRange(
  from?: string | Date | null,
  to?: string | Date | null
): string {
  if (!from && !to) return EMPTY_VALUE
  return `${formatDate(from)} → ${formatDate(to)}`
}

/**
 * Render a human-readable reference without ever exposing an identifier.
 * Empty values and UUIDs both fall back to `—`.
 */
export function formatReference(
  value?: string | null,
  fallback = EMPTY_VALUE
): string {
  if (!value || isUuid(value)) return fallback
  return value
}

/**
 * Pick the first usable display value (for example name, then code).
 * UUID values are ignored so they can never leak into the UI.
 */
export function formatReferenceOr(
  ...values: Array<string | null | undefined>
): string {
  for (const value of values) {
    if (value && !isUuid(value)) return value
  }
  return EMPTY_VALUE
}
