/**
 * Visit Plan API contract (`sales-execution-service`, `/api/v1/sfa/visit-plans`).
 * Mirrors `VisitPlanModels.java` and `VisitPlanController.java`.
 */

export type VisitPlanStatus =
  "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "WITHDRAWN"

export type VisitPlanType = "LOCAL" | "OUTSTATION"

/** MINE = the caller's own employee record; TEAM = direct reports only. */
export type VisitPlanScope = "MINE" | "TEAM"

export type VisitPlanCustomer = {
  customerUuid: string
  removedByApprover: boolean
  removedNote: string | null
}

export type VisitPlanDay = {
  date: string
  customers: VisitPlanCustomer[]
}

export type VisitPlan = {
  uuid: string
  employeeUuid: string
  /** First plan date. Always present, even for OUTSTATION plans. */
  date: string
  planType: VisitPlanType
  status: VisitPlanStatus
  reason: string | null
  customers: VisitPlanCustomer[]
  createdAt: string
  updatedAt: string
  fromDate: string
  toDate: string
  destinationGeographyUuid: string | null
  days: VisitPlanDay[]
}

export type VisitPlanOtherPlan = {
  planUuid: string
  employeeUuid: string
  status: VisitPlanStatus
}

export type VisitPlanCustomerDetail = VisitPlanCustomer & {
  /** Other employees' active plans on the same date containing this customer. */
  otherPlans: VisitPlanOtherPlan[]
}

export type VisitPlanDayDetail = {
  date: string
  customers: VisitPlanCustomerDetail[]
}

export type VisitPlanAuditAction =
  "CREATE" | "EDIT" | "RESUBMIT" | "WITHDRAW" | "APPROVE" | "REJECT"

export type VisitPlanAuditEvent = {
  action: VisitPlanAuditAction
  oldSummary: string | null
  newSummary: string | null
  reason: string | null
  actor: string
  at: string
}

export type VisitPlanDetail = {
  plan: VisitPlan
  /** Flattened per-customer detail (all days). */
  customers: VisitPlanCustomerDetail[]
  /** Oldest first. */
  auditEvents: VisitPlanAuditEvent[]
  days: VisitPlanDayDetail[]
}

/** Candidate returned by the unplanned-customer lookups. */
export type VisitPlanCandidate = {
  uuid: string
  customerCode: string
  shopName: string
  latitude: number | null
  longitude: number | null
}

export type VisitPlanListParams = {
  scope?: VisitPlanScope
  employeeUuid?: string
  status?: VisitPlanStatus
  /** Inclusive plan-date range. `from` must not be after `to`. */
  from?: string
  to?: string
  planType?: VisitPlanType
  page?: number
  /** 1..200 */
  size?: number
}

export type UnplannedCustomersParams = {
  employeeUuid?: string
  /** Required, today or later. */
  date: string
  q?: string
  page?: number
  /** 1..200 */
  size?: number
  /** The plan being edited, so its own customers appear as candidates. */
  excludePlanUuid?: string
  planType?: VisitPlanType
  /** Required for OUTSTATION; must be one of the employee's ADDITIONAL geographies. */
  destinationGeographyUuid?: string
}

export type SelectAllUnplannedCustomersParams = Omit<
  UnplannedCustomersParams,
  "page" | "size"
>

/** One OUTSTATION day. */
export type VisitPlanDayRequest = {
  date: string
  customerUuids: string[]
}

/**
 * Full replacement request for POST (create) and PUT (edit).
 * - LOCAL:       date + customerUuids (1..200 unique)
 * - OUTSTATION:  fromDate + toDate + destinationGeographyUuid + days
 *                (one entry per date in the inclusive range, 1..200 each)
 */
export type VisitPlanRequest = {
  /** Omit for self-submission. Only a manager may target another employee. */
  employeeUuid?: string
  date?: string
  planType: VisitPlanType
  customerUuids?: string[]
  fromDate?: string
  toDate?: string
  destinationGeographyUuid?: string
  days?: VisitPlanDayRequest[]
}

/** Per-day removal, OUTSTATION approval only. */
export type VisitPlanDayRemoval = {
  date: string
  removedCustomerUuids: string[]
}

/**
 * Approval body. Both removal forms are mutually exclusive and require a
 * shared note of 1..2000 characters when anything is removed.
 */
export type ApproveVisitPlanRequest = {
  removedCustomerUuids?: string[]
  note?: string | null
  days?: VisitPlanDayRemoval[]
}

export type RejectVisitPlanRequest = {
  /** Required, 1..2000 characters. */
  reason: string
}
