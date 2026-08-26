import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  RoleResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  PermissionCodesRequest,
} from "./role.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/v1/companies/${resolveCompanyUuid(companyUuid)}/roles`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getRoles(companyUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<RoleResponse[]>
  >(baseUrl(companyUuid), {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getRole(companyUuid: string, roleUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<RoleResponse>>(
    `${baseUrl(companyUuid)}/${roleUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function createRole(
  companyUuid: string,
  input: CreateRoleRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<ApiSuccessResponse<RoleResponse>>(
    baseUrl(companyUuid),
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function updateRole(
  companyUuid: string,
  roleUuid: string,
  input: UpdateRoleRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<ApiSuccessResponse<RoleResponse>>(
    `${baseUrl(companyUuid)}/${roleUuid}`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function updateRolePermissions(
  companyUuid: string,
  roleUuid: string,
  input: PermissionCodesRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<ApiSuccessResponse<RoleResponse>>(
    `${baseUrl(companyUuid)}/${roleUuid}/permissions`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function deleteRole(companyUuid: string, roleUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.delete<ApiSuccessResponse<null>>(
    `${baseUrl(companyUuid)}/${roleUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}
