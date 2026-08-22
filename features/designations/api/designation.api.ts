import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type {
  DesignationResponse,
  CreateDesignationRequest,
  UpdateDesignationRequest,
  UpdateDesignationStatusRequest,
  DesignationListParams,
} from "./designation.types"
import type { PageResponse } from "@/features/companies/api/company.types"

const baseUrl = (companyUuid: string) =>
  `/v1/companies/${companyUuid}/designations`

export async function getDesignations(
  companyUuid: string,
  params?: DesignationListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<DesignationResponse>>
  >(baseUrl(companyUuid), {
    params,
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function getDesignation(companyUuid: string, designationUuid: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<DesignationResponse>>(
    `${baseUrl(companyUuid)}/${designationUuid}`,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function createDesignation(
  companyUuid: string,
  input: CreateDesignationRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<DesignationResponse>>(
    baseUrl(companyUuid),
    input,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function updateDesignation(
  companyUuid: string,
  designationUuid: string,
  input: UpdateDesignationRequest
) {
  const { data } = await apiClient.put<ApiSuccessResponse<DesignationResponse>>(
    `${baseUrl(companyUuid)}/${designationUuid}`,
    input,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function updateDesignationStatus(
  companyUuid: string,
  designationUuid: string,
  input: UpdateDesignationStatusRequest
) {
  const { data } = await apiClient.patch<ApiSuccessResponse<DesignationResponse>>(
    `${baseUrl(companyUuid)}/${designationUuid}/status`,
    input,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}
