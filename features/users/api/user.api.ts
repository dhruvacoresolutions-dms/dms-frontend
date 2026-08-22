import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  EffectiveAccessResponse,
  AccessAssignmentResponse,
  CreateRoleAssignmentRequest,
  PermissionSetAssignmentRequest,
  UserListParams,
} from "./user.types"
import type { PageResponse } from "@/features/companies/api/company.types"

const baseUrl = (companyUuid: string) =>
  `/v1/companies/${companyUuid}/users`

export async function getUsers(
  companyUuid: string,
  params?: UserListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<UserResponse>>
  >(baseUrl(companyUuid), {
    params,
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function getUser(companyUuid: string, userUuid: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<UserResponse>>(
    `${baseUrl(companyUuid)}/${userUuid}`,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function createUser(
  companyUuid: string,
  input: CreateUserRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<UserResponse>>(
    baseUrl(companyUuid),
    input,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function updateUser(
  companyUuid: string,
  userUuid: string,
  input: UpdateUserRequest
) {
  const { data } = await apiClient.put<ApiSuccessResponse<UserResponse>>(
    `${baseUrl(companyUuid)}/${userUuid}`,
    input,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function updateUserStatus(
  companyUuid: string,
  userUuid: string,
  input: UpdateUserStatusRequest
) {
  const { data } = await apiClient.patch<ApiSuccessResponse<UserResponse>>(
    `${baseUrl(companyUuid)}/${userUuid}/status`,
    input,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function getUserEffectiveAccess(
  companyUuid: string,
  userUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<EffectiveAccessResponse>
  >(`${baseUrl(companyUuid)}/${userUuid}/effective-access`, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function getRoleAssignments(
  companyUuid: string,
  userUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<AccessAssignmentResponse[]>
  >(`${baseUrl(companyUuid)}/${userUuid}/role-assignments`, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function assignRole(
  companyUuid: string,
  userUuid: string,
  input: CreateRoleAssignmentRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<AccessAssignmentResponse>
  >(`${baseUrl(companyUuid)}/${userUuid}/role-assignments`, input, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function removeRoleAssignment(
  companyUuid: string,
  userUuid: string,
  assignmentUuid: string
) {
  const { data } = await apiClient.delete<ApiSuccessResponse<null>>(
    `${baseUrl(companyUuid)}/${userUuid}/role-assignments/${assignmentUuid}`,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function getPermissionSetAssignments(
  companyUuid: string,
  userUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<AccessAssignmentResponse[]>
  >(`${baseUrl(companyUuid)}/${userUuid}/permission-set-assignments`, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function assignPermissionSet(
  companyUuid: string,
  userUuid: string,
  input: PermissionSetAssignmentRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<AccessAssignmentResponse>
  >(
    `${baseUrl(companyUuid)}/${userUuid}/permission-set-assignments`,
    input,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function removePermissionSetAssignment(
  companyUuid: string,
  userUuid: string,
  assignmentUuid: string
) {
  const { data } = await apiClient.delete<ApiSuccessResponse<null>>(
    `${baseUrl(companyUuid)}/${userUuid}/permission-set-assignments/${assignmentUuid}`,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}
