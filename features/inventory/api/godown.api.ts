import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type { PageResponse } from "@/features/companies/api/company.types"
import { companyHeaders, distributorBase } from "./inventory-utils"
import type {
  CreateGodownRequest,
  GodownListParams,
  GodownResponse,
  UpdateGodownRequest,
  UpdateGodownStatusRequest,
} from "./inventory.types"

export async function getGodowns(
  companyUuid: string,
  distributorUuid: string,
  params?: GodownListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<GodownResponse>>
  >(`${distributorBase(companyUuid, distributorUuid)}/godowns`, {
    params,
    headers: companyHeaders(companyUuid),
  })
  return data.data
}

export async function getGodown(
  companyUuid: string,
  distributorUuid: string,
  godownUuid: string
) {
  const { data } = await apiClient.get<ApiSuccessResponse<GodownResponse>>(
    `${distributorBase(companyUuid, distributorUuid)}/godowns/${godownUuid}`,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}

export async function createGodown(
  companyUuid: string,
  distributorUuid: string,
  input: CreateGodownRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<GodownResponse>>(
    `${distributorBase(companyUuid, distributorUuid)}/godowns`,
    input,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}

export async function updateGodown(
  companyUuid: string,
  distributorUuid: string,
  godownUuid: string,
  input: UpdateGodownRequest
) {
  const { data } = await apiClient.put<ApiSuccessResponse<GodownResponse>>(
    `${distributorBase(companyUuid, distributorUuid)}/godowns/${godownUuid}`,
    input,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}

export async function updateGodownStatus(
  companyUuid: string,
  distributorUuid: string,
  godownUuid: string,
  action: "activate" | "deactivate",
  input: UpdateGodownStatusRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<GodownResponse>>(
    `${distributorBase(companyUuid, distributorUuid)}/godowns/${godownUuid}/${action}`,
    input,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}
