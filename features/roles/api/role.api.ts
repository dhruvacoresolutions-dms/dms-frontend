import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type {
  RoleResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  PermissionCodesRequest,
} from "./role.types"

const baseUrl = (companyUuid: string) =>
  `/v1/companies/${companyUuid}/roles`

export async function getRoles(companyUuid: string) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<RoleResponse[]>
  >(baseUrl(companyUuid), {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function getRole(companyUuid: string, roleUuid: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<RoleResponse>>(
    `${baseUrl(companyUuid)}/${roleUuid}`,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function createRole(
  companyUuid: string,
  input: CreateRoleRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<RoleResponse>>(
    baseUrl(companyUuid),
    input,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function updateRole(
  companyUuid: string,
  roleUuid: string,
  input: UpdateRoleRequest
) {
  const { data } = await apiClient.put<ApiSuccessResponse<RoleResponse>>(
    `${baseUrl(companyUuid)}/${roleUuid}`,
    input,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function updateRolePermissions(
  companyUuid: string,
  roleUuid: string,
  input: PermissionCodesRequest
) {
  const { data } = await apiClient.put<ApiSuccessResponse<RoleResponse>>(
    `${baseUrl(companyUuid)}/${roleUuid}/permissions`,
    input,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function deleteRole(companyUuid: string, roleUuid: string) {
  const { data } = await apiClient.delete<ApiSuccessResponse<null>>(
    `${baseUrl(companyUuid)}/${roleUuid}`,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}
