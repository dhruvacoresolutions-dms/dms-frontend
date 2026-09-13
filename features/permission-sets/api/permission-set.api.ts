import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  CreatePermissionSetRequest,
  PermissionCodesRequest,
  PermissionSetCreateResponse,
  PermissionSetDetail,
  PermissionSetListItem,
  PermissionSetListParams,
  PermissionSetPermissionsUpdateResponse,
  PermissionSetUpdateResponse,
  UpdatePermissionSetRequest,
} from "./permission-set.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/permission-sets`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

/** BE: List Permission Sets — GET /permission-sets → `PermissionSetListItem[]`. Supports `search`. */
export async function getPermissionSets(
  companyUuid: string,
  params?: PermissionSetListParams
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PermissionSetListItem[]>
  >(baseUrl(companyUuid), {
    params,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** BE: Get Single Permission Set — GET /permission-sets/{permissionSetUuid} → `PermissionSetDetail` (includes `permissionCodes`). */
export async function getPermissionSet(
  companyUuid: string,
  setUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PermissionSetDetail>
  >(`${baseUrl(companyUuid)}/${setUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** BE: Create Permission Set — POST /permission-sets `{ code, name, description? }` (201). 400 VALIDATION_ERROR, 409 PERMISSION_SET_ALREADY_EXISTS. */
export async function createPermissionSet(
  companyUuid: string,
  input: CreatePermissionSetRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<PermissionSetCreateResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** BE: Update Permission Set — PUT /permission-sets/{permissionSetUuid} `{ code, name, description? }`. 404 PERMISSION_SET_NOT_FOUND. */
export async function updatePermissionSet(
  companyUuid: string,
  setUuid: string,
  input: UpdatePermissionSetRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<PermissionSetUpdateResponse>
  >(`${baseUrl(companyUuid)}/${setUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** BE: Update Permission Set's permissions — PUT /permission-sets/{permissionSetUuid}/permissions `{ permissionCodes }` (must not be empty). 404 PERMISSION_NOT_FOUND. */
export async function updatePermissionSetPermissions(
  companyUuid: string,
  setUuid: string,
  input: PermissionCodesRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<PermissionSetPermissionsUpdateResponse>
  >(`${baseUrl(companyUuid)}/${setUuid}/permissions`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** BE: Delete Permission Set — DELETE /permission-sets/{permissionSetUuid} → `data: null`. 404 PERMISSION_SET_NOT_FOUND. */
export async function deletePermissionSet(
  companyUuid: string,
  setUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.delete<ApiSuccessResponse<null>>(
    `${baseUrl(companyUuid)}/${setUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}
