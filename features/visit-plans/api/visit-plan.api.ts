import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type { PageResponse } from "@/features/companies/api/company.types"
import type {
  ApproveVisitPlanRequest,
  RejectVisitPlanRequest,
  SelectAllUnplannedCustomersParams,
  UnplannedCustomersParams,
  VisitPlan,
  VisitPlanCandidate,
  VisitPlanDetail,
  VisitPlanListParams,
  VisitPlanRequest,
} from "./visit-plan.types"

/**
 * Visit plan API (`sales-execution-service`). The company is resolved from the
 * bearer token (plus the `X-Company-Context` header added by the shared axios
 * client), so no company UUID is part of the URL.
 */
const BASE = "/api/v1/sfa/visit-plans"

// ── Plans ───────────────────────────────────────────────────────────────────

export async function getVisitPlans(
  params?: VisitPlanListParams
): Promise<PageResponse<VisitPlan>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<VisitPlan>>
  >(BASE, { params })
  return data.data
}

export async function getVisitPlan(planUuid: string): Promise<VisitPlanDetail> {
  const { data } = await apiClient.get<ApiSuccessResponse<VisitPlanDetail>>(
    `${BASE}/${planUuid}`
  )
  return data.data
}

export async function createVisitPlan(
  input: VisitPlanRequest
): Promise<VisitPlan> {
  const { data } = await apiClient.post<ApiSuccessResponse<VisitPlan>>(
    BASE,
    input
  )
  return data.data
}

export async function updateVisitPlan(
  planUuid: string,
  input: VisitPlanRequest
): Promise<VisitPlan> {
  const { data } = await apiClient.put<ApiSuccessResponse<VisitPlan>>(
    `${BASE}/${planUuid}`,
    input
  )
  return data.data
}

export async function withdrawVisitPlan(planUuid: string): Promise<VisitPlan> {
  const { data } = await apiClient.post<ApiSuccessResponse<VisitPlan>>(
    `${BASE}/${planUuid}/withdraw`
  )
  return data.data
}

/**
 * Requeue a REJECTED or WITHDRAWN plan. The replacement body is optional: omit
 * it to reuse the plan's current date, type and non-removed customers.
 */
export async function resubmitVisitPlan(
  planUuid: string,
  input?: VisitPlanRequest
): Promise<VisitPlan> {
  const { data } = await apiClient.post<ApiSuccessResponse<VisitPlan>>(
    `${BASE}/${planUuid}/resubmit`,
    input
  )
  return data.data
}

export async function approveVisitPlan(
  planUuid: string,
  input?: ApproveVisitPlanRequest
): Promise<VisitPlan> {
  const { data } = await apiClient.post<ApiSuccessResponse<VisitPlan>>(
    `${BASE}/${planUuid}/approve`,
    input ?? {}
  )
  return data.data
}

export async function rejectVisitPlan(
  planUuid: string,
  input: RejectVisitPlanRequest
): Promise<VisitPlan> {
  const { data } = await apiClient.post<ApiSuccessResponse<VisitPlan>>(
    `${BASE}/${planUuid}/reject`,
    input
  )
  return data.data
}

// ── Unplanned customer lookups ──────────────────────────────────────────────

export async function getUnplannedCustomers(
  params: UnplannedCustomersParams
): Promise<PageResponse<VisitPlanCandidate>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<VisitPlanCandidate>>
  >(`${BASE}/unplanned-customers`, { params })
  return data.data
}

/** Server-side "select all" for the current filters. Capped at 200 ids. */
export async function selectAllUnplannedCustomers(
  params: SelectAllUnplannedCustomersParams
): Promise<string[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<string[]>>(
    `${BASE}/unplanned-customers/select-all`,
    { params }
  )
  return data.data
}
