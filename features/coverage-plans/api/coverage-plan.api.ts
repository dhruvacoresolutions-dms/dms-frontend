import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type { PageResponse } from "@/features/companies/api/company.types"
import type {
  CoverageDailyPlan,
  CoverageDailyPlanListParams,
  CoveragePlan,
  CoveragePlanDetail,
  CoveragePlanListParams,
  CoveragePlanRequest,
  CoverageRejectRequest,
} from "./coverage-plan.types"

/**
 * Coverage plan API (`sales-execution-service`). The company is resolved from
 * the bearer token (plus the `X-Company-Context` header added by the shared
 * axios client), so no company UUID is part of the URL.
 */
const BASE = "/api/v1/sfa/coverage-plans"

// ── Plans ───────────────────────────────────────────────────────────────────

export async function getCoveragePlans(
  params?: CoveragePlanListParams
): Promise<PageResponse<CoveragePlan>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<CoveragePlan>>
  >(BASE, { params })
  return data.data
}

export async function getCoveragePlan(
  planUuid: string
): Promise<CoveragePlanDetail> {
  const { data } = await apiClient.get<ApiSuccessResponse<CoveragePlanDetail>>(
    `${BASE}/${planUuid}`
  )
  return data.data
}

export async function getCoveragePlanDailyPlans(
  planUuid: string,
  params?: CoverageDailyPlanListParams
): Promise<PageResponse<CoverageDailyPlan>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<CoverageDailyPlan>>
  >(`${BASE}/${planUuid}/daily-plans`, { params })
  return data.data
}

export async function createCoveragePlan(
  input: CoveragePlanRequest
): Promise<CoveragePlan> {
  const { data } = await apiClient.post<ApiSuccessResponse<CoveragePlan>>(
    BASE,
    input
  )
  return data.data
}

export async function updateCoveragePlan(
  planUuid: string,
  input: CoveragePlanRequest
): Promise<CoveragePlan> {
  const { data } = await apiClient.put<ApiSuccessResponse<CoveragePlan>>(
    `${BASE}/${planUuid}`,
    input
  )
  return data.data
}

/**
 * Requeue a REJECTED or WITHDRAWN plan. The replacement body is optional:
 * omit it to reuse the plan's current dates, repeat rule and weekdays.
 */
export async function resubmitCoveragePlan(
  planUuid: string,
  input?: CoveragePlanRequest
): Promise<CoveragePlan> {
  const { data } = await apiClient.post<ApiSuccessResponse<CoveragePlan>>(
    `${BASE}/${planUuid}/resubmit`,
    input
  )
  return data.data
}

export async function approveCoveragePlan(
  planUuid: string
): Promise<CoveragePlan> {
  const { data } = await apiClient.post<ApiSuccessResponse<CoveragePlan>>(
    `${BASE}/${planUuid}/approve`
  )
  return data.data
}

export async function rejectCoveragePlan(
  planUuid: string,
  input: CoverageRejectRequest
): Promise<CoveragePlan> {
  const { data } = await apiClient.post<ApiSuccessResponse<CoveragePlan>>(
    `${BASE}/${planUuid}/reject`,
    input
  )
  return data.data
}

export async function withdrawCoveragePlan(
  planUuid: string
): Promise<CoveragePlan> {
  const { data } = await apiClient.post<ApiSuccessResponse<CoveragePlan>>(
    `${BASE}/${planUuid}/withdraw`
  )
  return data.data
}

export async function cancelCoveragePlan(
  planUuid: string
): Promise<CoveragePlan> {
  const { data } = await apiClient.post<ApiSuccessResponse<CoveragePlan>>(
    `${BASE}/${planUuid}/cancel`
  )
  return data.data
}
