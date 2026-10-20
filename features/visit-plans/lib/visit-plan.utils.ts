import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns"

import { getApiError, getApiErrorMessage } from "@/lib/api/api-error"
import type {
  VisitPlan,
  VisitPlanStatus,
  VisitPlanType,
} from "../api/visit-plan.types"

/** Maximum customers on a plan / plan day (`Must contain 1..200 customers`). */
export const MAX_VISIT_PLAN_CUSTOMERS = 200

/** OUTSTATION ranges must span fewer than 31 days (`Must span at most 31 days`). */
export const MAX_VISIT_PLAN_SPAN_DAYS = 31

/** Rejection reason and removal note limits (`1..2000 characters`). */
export const MAX_VISIT_PLAN_NOTE_LENGTH = 2000

export const VISIT_PLAN_STATUSES: VisitPlanStatus[] = [
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
]

export const VISIT_PLAN_TYPES: VisitPlanType[] = ["LOCAL", "OUTSTATION"]

export const VISIT_PLAN_STATUS_LABELS: Record<VisitPlanStatus, string> = {
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
}

/** `yyyy-MM-dd` → `dd MMM yyyy` (returns `—` for empty/invalid input). */
export function formatVisitPlanDate(value?: string | null): string {
  if (!value) return "—"
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, "dd MMM yyyy") : value
}

/** ISO date-time → `dd MMM yyyy, HH:mm`. */
export function formatVisitPlanDateTime(value?: string | null): string {
  if (!value) return "—"
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, "dd MMM yyyy, HH:mm") : value
}

/** `2026-10-21` or `21 Oct 2026` when the plan spans more than one day. */
export function formatVisitPlanDateRange(
  from?: string | null,
  to?: string | null
): string {
  if (!from) return "—"
  if (!to || from === to) return formatVisitPlanDate(from)
  return `${formatVisitPlanDate(from)} – ${formatVisitPlanDate(to)}`
}

/** Today as `yyyy-MM-dd` in the browser's local timezone. */
export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd")
}

/** Tomorrow as `yyyy-MM-dd` in the browser's local timezone. */
export function tomorrowIso(): string {
  const next = new Date()
  next.setDate(next.getDate() + 1)
  return format(next, "yyyy-MM-dd")
}

/** Inclusive list of ISO dates for [from, to]; empty when invalid/reversed. */
export function enumerateDates(from?: string, to?: string): string[] {
  if (!from || !to) return []
  const start = parseISO(from)
  const end = parseISO(to)
  if (!isValid(start) || !isValid(end) || end < start) return []
  const dates: string[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    dates.push(format(cursor, "yyyy-MM-dd"))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

/**
 * Inclusive day count. The backend rejects `>= 31` days between fromDate and
 * toDate, i.e. a maximum of 31 inclusive days.
 */
export function isVisitPlanSpanValid(from?: string, to?: string): boolean {
  if (!from || !to) return false
  const start = parseISO(from)
  const end = parseISO(to)
  if (!isValid(start) || !isValid(end)) return false
  if (end < start) return false
  return differenceInCalendarDays(end, start) < MAX_VISIT_PLAN_SPAN_DAYS
}

/** Non-removed customer ids of one plan, in day order. */
export function activeCustomers(plan: VisitPlan): string[] {
  return plan.days
    .flatMap((day) => day.customers)
    .filter((customer) => !customer.removedByApprover)
    .map((customer) => customer.customerUuid)
}

export function countActiveCustomers(plan: VisitPlan): number {
  return plan.days.reduce(
    (total, day) =>
      total + day.customers.filter((c) => !c.removedByApprover).length,
    0
  )
}

export function countRemovedCustomers(plan: VisitPlan): number {
  return plan.days.reduce(
    (total, day) =>
      total + day.customers.filter((c) => c.removedByApprover).length,
    0
  )
}

/**
 * Backend error message for a visit-plan mutation. Prefers the first
 * field-level message (e.g. "Date must be tomorrow or later") over the
 * generic "Request validation failed" envelope message.
 */
export function getVisitPlanErrorMessage(
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

/** All field messages from a validation envelope, e.g. for the form summary. */
export function getVisitPlanFieldErrors(error: unknown) {
  return getApiError(error)?.errors ?? []
}
