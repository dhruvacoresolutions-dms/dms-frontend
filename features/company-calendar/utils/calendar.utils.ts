import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns"

import { getApiError, getApiErrorMessage } from "@/lib/api/api-error"
import type { FiscalYear } from "../api/company-calendar.types"

/** `yyyy-MM-dd` → `dd MMM yyyy` (returns `—` for empty/invalid input). */
export function formatCalendarDate(value?: string | null): string {
  if (!value) return "—"
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, "dd MMM yyyy") : "—"
}

/** ISO date-time → `dd MMM yyyy, HH:mm`. */
export function formatCalendarDateTime(value?: string | null): string {
  if (!value) return "—"
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, "dd MMM yyyy, HH:mm") : "—"
}

/** Inclusive number of days between two ISO dates. */
export function inclusiveDayCount(from: string, to: string): number {
  const start = parseISO(from)
  const end = parseISO(to)
  if (!isValid(start) || !isValid(end)) return 0
  return differenceInCalendarDays(end, start) + 1
}

/** The service rejects ranges of 400 days or more (max 400 inclusive days). */
export function isEffectiveRangeValid(from: string, to: string): boolean {
  const start = parseISO(from)
  const end = parseISO(to)
  if (!isValid(start) || !isValid(end)) return false
  if (end < start) return false
  return differenceInCalendarDays(end, start) < 400
}

export function sortFiscalYears(years: FiscalYear[]): FiscalYear[] {
  return [...years].sort((a, b) => a.startDate.localeCompare(b.startDate))
}

/**
 * Backend error message for a mutation. Prefers the first field-level
 * invariant message (e.g. "periods must be contiguous without gaps or
 * overlaps") over the generic "Request validation failed" envelope message,
 * and falls back to network/timeout copy from the shared helper.
 */
export function getCalendarErrorMessage(
  error: unknown,
  fallback: string
): string {
  const apiError = getApiError(error)
  const fieldMessage = apiError?.errors?.find(
    (detail) => detail?.message
  )?.message
  if (fieldMessage) return fieldMessage
  return getApiErrorMessage(error, fallback)
}
