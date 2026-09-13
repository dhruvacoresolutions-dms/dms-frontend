import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  DepartmentResponse,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  DepartmentListParams,
} from "./department.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/departments`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getDepartments(
  companyUuid: string,
  params?: DepartmentListParams
) {
  const resolved = companyHeader(companyUuid)
  // Send both `query` and `search`: different backend endpoints honor
  // different names, unknown params are ignored.
  const term = params?.query ?? params?.search
  const queryParams = params
    ? { ...params, query: term, search: term }
    : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<DepartmentResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getDepartment(
  companyUuid: string,
  departmentUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<DepartmentResponse>>(
    `${baseUrl(companyUuid)}/${departmentUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function createDepartment(
  companyUuid: string,
  input: CreateDepartmentRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<DepartmentResponse>
  >(baseUrl(companyUuid), input, { headers: { "X-Company-Context": resolved } })
  return data.data
}

export async function updateDepartment(
  companyUuid: string,
  departmentUuid: string,
  input: UpdateDepartmentRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<ApiSuccessResponse<DepartmentResponse>>(
    `${baseUrl(companyUuid)}/${departmentUuid}`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}
