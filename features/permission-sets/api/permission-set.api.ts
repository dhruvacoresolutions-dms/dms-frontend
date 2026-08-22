import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type {
  PermissionSetResponse,
  CreatePermissionSetRequest,
  UpdatePermissionSetRequest,
  PermissionCodesRequest,
} from "./permission-set.types"

const baseUrl = (companyUuid: string) =>
  `/v1/companies/${companyUuid}/permission-sets`

export async function getPermissionSets(companyUuid: string) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PermissionSetResponse[]>
  >(baseUrl(companyUuid), {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function getPermissionSet(
  companyUuid: string,
  setUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PermissionSetResponse>
  >(`${baseUrl(companyUuid)}/${setUuid}`, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function createPermissionSet(
  companyUuid: string,
  input: CreatePermissionSetRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<PermissionSetResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function updatePermissionSet(
  companyUuid: string,
  setUuid: string,
  input: UpdatePermissionSetRequest
) {
  const { data } = await apiClient.put<
    ApiSuccessResponse<PermissionSetResponse>
  >(`${baseUrl(companyUuid)}/${setUuid}`, input, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function updatePermissionSetPermissions(
  companyUuid: string,
  setUuid: string,
  input: PermissionCodesRequest
) {
  const { data } = await apiClient.put<
    ApiSuccessResponse<PermissionSetResponse>
  >(`${baseUrl(companyUuid)}/${setUuid}/permissions`, input, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function deletePermissionSet(
  companyUuid: string,
  setUuid: string
) {
  const { data } = await apiClient.delete<ApiSuccessResponse<null>>(
    `${baseUrl(companyUuid)}/${setUuid}`,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}
