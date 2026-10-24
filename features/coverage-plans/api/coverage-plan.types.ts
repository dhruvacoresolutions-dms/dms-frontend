/**
 * Coverage plan API contract (`sales-execution-service`,
 * `/api/v1/sfa/coverage-plans`).
 *
 * Mirrors `CoverageModels.java` and `CoverageController.java`. A coverage plan
 * is a recurring Monday–Saturday customer template for one employee. An
 * employee submission starts PENDING_APPROVAL; a manager/admin creation on the
 * employee's behalf starts APPROVED and generates visit plans immediately.
 */

export type CoveragePlanStatus =
  "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "CANCELLED"

export type CoveragePlanSource = "EMPLOYEE" | "MANAGER" | "ADMIN"

export type CoverageRepeatType = "TILL_DATE" | "N_WEEKS" | "N_PERIODS"

/** Sunday is never a coverage day. */
export type CoverageWeekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT"

export type CoverageSkipReason =
  | "HOLIDAY"
  | "WEEKLY_OFF"
  | "MANUAL_PLAN_EXISTS"
  | "CUSTOMER_INACTIVE"
  | "NOT_IN_PRIMARY"

/** Generated visit plans use the visit-plan lifecycle plus cancellation. */
export type CoverageDailyPlanStatus =
  "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "CANCELLED"

/** MINE = the caller's own employee record; TEAM = direct reports only. */
export type CoveragePlanScope = "MINE" | "TEAM"

export type CoverageAuditAction =
  "CREATE" | "EDIT" | "RESUBMIT" | "WITHDRAW" | "APPROVE" | "REJECT" | "CANCEL"

export type CoverageRepeatRule = {
  type: CoverageRepeatType
  /** Null for TILL_DATE, 1..92 for N_WEEKS and N_PERIODS. */
  value: number | null
}

export type CoverageLine = {
  weekday: CoverageWeekday
  /** 1..200 unique customer UUIDs. */
  customerUuids: string[]
}

export type CoveragePlan = {
  uuid: string
  employeeUuid: string
  startDate: string
  endDate: string
  repeatRule: CoverageRepeatRule
  status: CoveragePlanStatus
  source: CoveragePlanSource
  rejectReason: string | null
  /** Weekday template lines, ordered MON..SAT. */
  lines: CoverageLine[]
  createdAt: string
  updatedAt: string
}

export type CoverageSkipped = {
  date: string
  customerUuid: string
  reason: CoverageSkipReason
}

export type CoverageDailyPlan = {
  /** Generated visit-plan UUID. */
  uuid: string
  date: string
  status: CoverageDailyPlanStatus
  /** True when a user changed the generated visit plan. */
  manuallyModified: boolean
  /** True when visit execution has started for one of the day's customers. */
  started: boolean
}

export type CoverageAuditEvent = {
  action: CoverageAuditAction
  /** Java record summary; intentionally not rendered as user-facing text. */
  oldSummary: string | null
  /** Java record summary; intentionally not rendered as user-facing text. */
  newSummary: string | null
  reason: string | null
  actor: string
  at: string
}

export type CoveragePlanDetail = {
  plan: CoveragePlan
  /** Generated visit plans, newest date first. Empty before approval. */
  dailyPlans: CoverageDailyPlan[]
  /** Date/customer pairs skipped during generation, ordered by date. */
  skipped: CoverageSkipped[]
  /** Oldest first. */
  auditEvents: CoverageAuditEvent[]
}

export type CoveragePlanListParams = {
  scope?: CoveragePlanScope
  /** Must resolve inside the selected scope (MINE/TEAM). */
  employeeUuid?: string
  status?: CoveragePlanStatus
  /** Inclusive overlap filters on the plan's startDate/endDate. */
  from?: string
  to?: string
  page?: number
  /** 1..200 */
  size?: number
}

/**
 * Full replacement body for POST (create), PUT (edit) and the optional body of
 * POST /{uuid}/resubmit.
 */
export type CoveragePlanRequest = {
  employeeUuid: string
  startDate: string
  endDate: string
  repeatRule: CoverageRepeatRule
  lines: CoverageLine[]
}

export type CoverageRejectRequest = {
  /** 1..2000 characters after trimming. */
  reason: string
}

export type CoverageDailyPlanListParams = {
  page?: number
  /** 1..200 */
  size?: number
}
