import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
} from "date-fns"

import { getApiError, getApiErrorMessage } from "@/lib/api/api-error"
import type {
  CoverageAuditAction,
  CoverageLine,
  CoveragePlan,
  CoveragePlanRequest,
  CoveragePlanSource,
  CoveragePlanStatus,
  CoverageRepeatRule,
  CoverageRepeatType,
  CoverageSkipReason,
  CoverageWeekday,
} from "../api/coverage-plan.types"

/** A weekday line accepts 1..200 unique customers. */
export const MAX_COVERAGE_CUSTOMERS = 200

/** A coverage plan spans 1..92 calendar days inclusive. */
export const MAX_COVERAGE_SPAN_DAYS = 92

/** N_WEEKS is capped by the 92-day span (13 weeks = 91 inclusive days). */
export const MAX_COVERAGE_WEEKS = 13

/** The backend's own repeatRule.value ceiling. */
export const MAX_COVERAGE_PERIODS = 92

/** Rejection reason limit (`1..2000 characters`). */
export const MAX_COVERAGE_REASON_LENGTH = 2000

export const COVERAGE_WEEKDAYS: CoverageWeekday[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
]

export const COVERAGE_WEEKDAY_LABELS: Record<CoverageWeekday, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
}

export const COVERAGE_WEEKDAY_SHORT_LABELS: Record<CoverageWeekday, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
}

export const COVERAGE_PLAN_STATUSES: CoveragePlanStatus[] = [
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
  "CANCELLED",
]

export const COVERAGE_PLAN_STATUS_LABELS: Record<CoveragePlanStatus, string> = {
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  CANCELLED: "Cancelled",
}

export const COVERAGE_PLAN_SOURCE_LABELS: Record<CoveragePlanSource, string> = {
  EMPLOYEE: "Employee submission",
  MANAGER: "Created by manager",
  ADMIN: "Created by administrator",
}

export const COVERAGE_REPEAT_TYPES: CoverageRepeatType[] = [
  "TILL_DATE",
  "N_WEEKS",
  "N_PERIODS",
]

export const COVERAGE_REPEAT_TYPE_LABELS: Record<CoverageRepeatType, string> = {
  TILL_DATE: "Until a date",
  N_WEEKS: "For a number of weeks",
  N_PERIODS: "For a number of accounting periods",
}

export const COVERAGE_SKIP_REASON_LABELS: Record<CoverageSkipReason, string> = {
  HOLIDAY: "Company holiday",
  WEEKLY_OFF: "Weekly off",
  MANUAL_PLAN_EXISTS: "Manual visit plan exists",
  CUSTOMER_INACTIVE: "Customer inactive",
  NOT_IN_PRIMARY: "Outside primary geography",
}

export const COVERAGE_AUDIT_ACTION_LABELS: Record<CoverageAuditAction, string> =
  {
    CREATE: "Created",
    EDIT: "Edited",
    RESUBMIT: "Resubmitted",
    WITHDRAW: "Withdrawn",
    APPROVE: "Approved",
    REJECT: "Rejected",
    CANCEL: "Cancelled",
  }

/** `yyyy-MM-dd` → `dd MMM yyyy` (returns `—` for empty/invalid input). */
export function formatCoverageDate(value?: string | null): string {
  if (!value) return "—"
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, "dd MMM yyyy") : "—"
}

/** ISO date-time → `dd MMM yyyy, HH:mm`. */
export function formatCoverageDateTime(value?: string | null): string {
  if (!value) return "—"
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, "dd MMM yyyy, HH:mm") : "—"
}

/** `21 Oct 2026 – 17 Nov 2026`, or a single date when the range is one day. */
export function formatCoverageDateRange(
  from?: string | null,
  to?: string | null
): string {
  if (!from) return "—"
  if (!to || from === to) return formatCoverageDate(from)
  return `${formatCoverageDate(from)} – ${formatCoverageDate(to)}`
}

/** Today as `yyyy-MM-dd` in the browser's local timezone. */
export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd")
}

/** Tomorrow as `yyyy-MM-dd` in the browser's local timezone. */
export function tomorrowIso(): string {
  return format(addDays(new Date(), 1), "yyyy-MM-dd")
}

/** Add calendar days to an ISO date; returns `""` for invalid input. */
export function addDaysIso(iso: string | undefined, days: number): string {
  if (!iso) return ""
  const parsed = parseISO(iso)
  if (!isValid(parsed)) return ""
  return format(addDays(parsed, days), "yyyy-MM-dd")
}

/** Inclusive day count between two ISO dates; `0` when invalid/reversed. */
export function coverageSpanDays(
  startDate?: string | null,
  endDate?: string | null
): number {
  if (!startDate || !endDate) return 0
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  if (!isValid(start) || !isValid(end) || end < start) return 0
  return differenceInCalendarDays(end, start) + 1
}

/** The backend accepts 1..92 inclusive calendar days. */
export function isCoverageSpanValid(
  startDate?: string | null,
  endDate?: string | null
): boolean {
  const days = coverageSpanDays(startDate, endDate)
  return days >= 1 && days <= MAX_COVERAGE_SPAN_DAYS
}

/** Last covered date for an N_WEEKS rule. */
export function coverageWeeksEndDate(
  startDate?: string | null,
  weeks?: number | null
): string {
  if (!startDate || !weeks || weeks < 1) return ""
  return addDaysIso(startDate, weeks * 7 - 1)
}

/**
 * The effective last date shown in the builder. For N_PERIODS the server
 * derives the end date from the company's accounting calendar, so `null`
 * means "calculated by the server".
 */
export function effectiveCoverageEndDate(input: {
  startDate?: string | null
  repeatType: CoverageRepeatType
  endDate?: string | null
  value?: number | null
}): string | null {
  if (input.repeatType === "TILL_DATE") return input.endDate ?? null
  if (input.repeatType === "N_WEEKS")
    return coverageWeeksEndDate(input.startDate, input.value) || null
  return null
}

/** Maximum repeat value the builder offers for a repeat type. */
export function maxCoverageRepeatValue(type: CoverageRepeatType): number {
  if (type === "N_WEEKS") return MAX_COVERAGE_WEEKS
  if (type === "N_PERIODS") return MAX_COVERAGE_PERIODS
  return 0
}

/** Human label for a repeat rule, e.g. "3 weeks" or "Until 17 Nov 2026". */
export function formatCoverageRepeatRule(
  rule: CoverageRepeatRule | null | undefined,
  endDate?: string | null
): string {
  if (!rule) return "—"
  switch (rule.type) {
    case "TILL_DATE":
      return `Until ${formatCoverageDate(endDate)}`
    case "N_WEEKS":
      return `${rule.value ?? 0} week${rule.value === 1 ? "" : "s"}`
    case "N_PERIODS":
      return `${rule.value ?? 0} accounting period${rule.value === 1 ? "" : "s"}`
    default:
      return "—"
  }
}

/** Customer UUIDs on a single weekday, or an empty list. */
export function coverageLineCustomers(
  plan: Pick<CoveragePlan, "lines">,
  weekday: CoverageWeekday
): string[] {
  return (
    plan.lines.find((line) => line.weekday === weekday)?.customerUuids ?? []
  )
}

/** Per-weekday customer counts, with every weekday present. */
export function coverageWeekdayCounts(
  plan: Pick<CoveragePlan, "lines">
): Record<CoverageWeekday, number> {
  const counts = {
    MON: 0,
    TUE: 0,
    WED: 0,
    THU: 0,
    FRI: 0,
    SAT: 0,
  } satisfies Record<CoverageWeekday, number>

  for (const line of plan.lines) {
    counts[line.weekday] = line.customerUuids.length
  }
  return counts
}

/** Number of weekday lines that actually cover customers. */
export function coverageWeekdayCount(
  plan: Pick<CoveragePlan, "lines">
): number {
  return plan.lines.filter((line) => line.customerUuids.length > 0).length
}

/** Total customer assignments across all weekday lines. */
export function coverageTotalCustomers(
  plan: Pick<CoveragePlan, "lines">
): number {
  return plan.lines.reduce(
    (total, line) => total + line.customerUuids.length,
    0
  )
}

/** Compact "Mon, Tue, Wed" list for tables and summaries. */
export function coverageWeekdaysLabel(
  plan: Pick<CoveragePlan, "lines">
): string {
  const weekdays = COVERAGE_WEEKDAYS.filter(
    (weekday) => coverageLineCustomers(plan, weekday).length > 0
  ).map((weekday) => COVERAGE_WEEKDAY_SHORT_LABELS[weekday])
  return weekdays.length ? weekdays.join(", ") : "No weekdays"
}

/**
 * Convert builder state into the ordered API line list. Only included
 * weekdays with at least one customer are sent; duplicates are removed while
 * preserving the original selection order.
 */
export function buildCoverageLines(
  lines: Array<{
    weekday: CoverageWeekday
    customerUuids: string[]
    included?: boolean
  }>
): CoverageLine[] {
  return COVERAGE_WEEKDAYS.flatMap((weekday) => {
    const line = lines.find((candidate) => candidate.weekday === weekday)
    if (!line || line.included === false) return []
    const customerUuids = Array.from(new Set(line.customerUuids))
    if (customerUuids.length === 0) return []
    return [{ weekday, customerUuids }]
  })
}

/** Full replacement body for edit/resubmit from an existing plan. */
export function coverageRequestFromPlan(
  plan: CoveragePlan
): CoveragePlanRequest {
  return {
    employeeUuid: plan.employeeUuid,
    startDate: plan.startDate,
    endDate: plan.endDate,
    repeatRule: { ...plan.repeatRule },
    lines: plan.lines.map((line) => ({
      weekday: line.weekday,
      customerUuids: [...line.customerUuids],
    })),
  }
}

/**
 * Map a server field path (`lines[2].customerUuids`) onto the builder's fixed
 * weekday lines. Unmapped fields return `null` and are shown in the form-level
 * alert instead.
 */
export function coverageServerFieldPath(
  field: string
):
  | "employeeUuid"
  | "startDate"
  | "endDate"
  | "repeatType"
  | "repeatValue"
  | `lines.${number}.customerUuids`
  | null {
  if (field === "employeeUuid") return "employeeUuid"
  if (field === "startDate") return "startDate"
  if (field === "endDate") return "endDate"
  if (field === "repeatRule.type") return "repeatType"
  if (field === "repeatRule.value") return "repeatValue"

  const lineMatch = /^lines\[(\d+)\]\.customerUuids$/.exec(field)
  if (lineMatch) {
    const index = Number(lineMatch[1])
    return `lines.${index}.customerUuids`
  }

  return null
}

/**
 * True when the backend rejects a plan because the employee already has an
 * active plan in the same period.
 *
 * The deployed service currently reports this as `VALIDATION_ERROR` on the
 * `repeatRule` field; the published OpenAPI/Bruno contract uses
 * `COVERAGE_PLAN_OVERLAP` (409). Support both shapes until the backend
 * alignment lands.
 */
export function isCoveragePlanOverlapError(error: unknown): boolean {
  const apiError = getApiError(error)
  if (!apiError) return false
  if (apiError.code === "COVERAGE_PLAN_OVERLAP") return true

  const repeatRule = apiError.errors?.find(
    (detail) => detail.field === "repeatRule"
  )
  return !!repeatRule?.message?.toLowerCase().includes("already exists")
}

/**
 * Backend error message for a coverage-plan mutation. Prefers the overlap
 * message, then the first field-level message, over the generic
 * "Request validation failed" envelope message.
 */
export function getCoveragePlanErrorMessage(
  error: unknown,
  fallback: string
): string {
  const apiError = getApiError(error)
  if (isCoveragePlanOverlapError(error)) {
    const overlapMessage =
      apiError?.errors?.find((detail) => detail.field === "repeatRule")
        ?.message ?? apiError?.errors?.find((detail) => detail.message)?.message
    return (
      overlapMessage ??
      "An active coverage plan already exists for this employee in this period. Cancel or change the existing plan first."
    )
  }

  const fieldMessage = apiError?.errors?.find(
    (detail) => detail?.message
  )?.message
  if (fieldMessage) return fieldMessage
  return getApiErrorMessage(error, fallback)
}

/** All field messages from a validation envelope, e.g. for the form summary. */
export function getCoveragePlanFieldErrors(error: unknown) {
  return getApiError(error)?.errors ?? []
}
