import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type {
  PermissionResponse,
  PermissionModuleResponse,
  PermissionListParams,
} from "./permission.types"

export async function getPermissions(params?: PermissionListParams) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PermissionResponse[]>
  >("/v1/permissions", { params })
  return data.data
}

export async function getPermissionMatrix() {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PermissionModuleResponse[]>
  >("/v1/permissions/matrix")
  return data.data
}
