import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  CreateRoleRequest,
  PermissionCodesRequest,
  RoleCreateResponse,
  RoleDetail,
  RoleListItem,
  RolePermissionsUpdateResponse,
  RoleUpdateResponse,
  UpdateRoleRequest,
} from "./role.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/roles`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

/** BE: List Roles — GET /roles → `RoleListItem[]`. */
export async function getRoles(companyUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<RoleListItem[]>
  >(baseUrl(companyUuid), {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** BE: Get Single Role — GET /roles/{roleUuid} → `RoleDetail` (includes `permissionCodes`). */
export async function getRole(companyUuid: string, roleUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<RoleDetail>>(
    `${baseUrl(companyUuid)}/${roleUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

/** BE: Create Role — POST /roles `{ code, name, description? }`. 400 VALIDATION_ERROR, 409 ROLE_ALREADY_EXISTS. */
export async function createRole(
  companyUuid: string,
  input: CreateRoleRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<RoleCreateResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** BE: Update Role — PUT /roles/{roleUuid} `{ name, description?, status }`. 404 ROLE_NOT_FOUND, 409 SYSTEM_ROLE_IMMUTABLE. */
export async function updateRole(
  companyUuid: string,
  roleUuid: string,
  input: UpdateRoleRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<RoleUpdateResponse>
  >(`${baseUrl(companyUuid)}/${roleUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** BE: Update Role Permissions — PUT /roles/{roleUuid}/permissions `{ permissionCodes }`. 404 PERMISSION_NOT_FOUND. */
export async function updateRolePermissions(
  companyUuid: string,
  roleUuid: string,
  input: PermissionCodesRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<RolePermissionsUpdateResponse>
  >(`${baseUrl(companyUuid)}/${roleUuid}/permissions`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** BE: Delete Role — DELETE /roles/{roleUuid} → `data: null`. 404 ROLE_NOT_FOUND, 409 SYSTEM_ROLE_IMMUTABLE. */
export async function deleteRole(companyUuid: string, roleUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.delete<ApiSuccessResponse<null>>(
    `${baseUrl(companyUuid)}/${roleUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}
