import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  PermissionSetResponse,
  CreatePermissionSetRequest,
  UpdatePermissionSetRequest,
  PermissionCodesRequest,
} from "./permission-set.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/v1/companies/${resolveCompanyUuid(companyUuid)}/permission-sets`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getPermissionSets(companyUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PermissionSetResponse[]>
  >(baseUrl(companyUuid), {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getPermissionSet(
  companyUuid: string,
  setUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PermissionSetResponse>
  >(`${baseUrl(companyUuid)}/${setUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createPermissionSet(
  companyUuid: string,
  input: CreatePermissionSetRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<PermissionSetResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updatePermissionSet(
  companyUuid: string,
  setUuid: string,
  input: UpdatePermissionSetRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<PermissionSetResponse>
  >(`${baseUrl(companyUuid)}/${setUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updatePermissionSetPermissions(
  companyUuid: string,
  setUuid: string,
  input: PermissionCodesRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<PermissionSetResponse>
  >(`${baseUrl(companyUuid)}/${setUuid}/permissions`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

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
