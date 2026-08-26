import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  UserResponse,
  RawUserResponse,
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

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/v1/companies/${resolveCompanyUuid(companyUuid)}/users`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

function normalizeUser(raw: RawUserResponse): UserResponse {
  const publicId = raw.publicId ?? raw.userUuid ?? ""
  return {
    ...raw,
    publicId,
    userUuid: raw.userUuid ?? publicId,
    email: raw.email ?? null,
  } as UserResponse
}

export async function getUsers(
  companyUuid: string,
  params?: UserListParams
) {
  const resolved = companyHeader(companyUuid)
  const queryParams = params ? { ...params, query: (params as Record<string, unknown>).query ?? (params as Record<string, unknown>).search } as UserListParams : params
  if (queryParams && "search" in (queryParams as Record<string, unknown>) && !queryParams.query) {
    queryParams.query = queryParams.search
    delete (queryParams as Record<string, unknown>).search
  }
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<RawUserResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  const page = data.data
  return {
    ...page,
    content: page.content.map(normalizeUser),
  } as PageResponse<UserResponse>
}

export async function getUser(companyUuid: string, userUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<RawUserResponse>>(
    `${baseUrl(companyUuid)}/${userUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return normalizeUser(data.data)
}

export async function createUser(
  companyUuid: string,
  input: CreateUserRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<ApiSuccessResponse<RawUserResponse>>(
    baseUrl(companyUuid),
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return normalizeUser(data.data)
}

export async function updateUser(
  companyUuid: string,
  userUuid: string,
  input: UpdateUserRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<ApiSuccessResponse<RawUserResponse>>(
    `${baseUrl(companyUuid)}/${userUuid}`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return normalizeUser(data.data)
}

export async function updateUserStatus(
  companyUuid: string,
  userUuid: string,
  input: UpdateUserStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<ApiSuccessResponse<RawUserResponse>>(
    `${baseUrl(companyUuid)}/${userUuid}/status`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return normalizeUser(data.data)
}

export async function getUserEffectiveAccess(
  companyUuid: string,
  userUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<EffectiveAccessResponse>
  >(`${baseUrl(companyUuid)}/${userUuid}/effective-access`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getRoleAssignments(
  companyUuid: string,
  userUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<AccessAssignmentResponse[]>
  >(`${baseUrl(companyUuid)}/${userUuid}/role-assignments`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function assignRole(
  companyUuid: string,
  userUuid: string,
  input: CreateRoleAssignmentRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<AccessAssignmentResponse>
  >(`${baseUrl(companyUuid)}/${userUuid}/role-assignments`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function removeRoleAssignment(
  companyUuid: string,
  userUuid: string,
  assignmentUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.delete<ApiSuccessResponse<null>>(
    `${baseUrl(companyUuid)}/${userUuid}/role-assignments/${assignmentUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function getPermissionSetAssignments(
  companyUuid: string,
  userUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<AccessAssignmentResponse[]>
  >(`${baseUrl(companyUuid)}/${userUuid}/permission-set-assignments`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function assignPermissionSet(
  companyUuid: string,
  userUuid: string,
  input: PermissionSetAssignmentRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<AccessAssignmentResponse>
  >(
    `${baseUrl(companyUuid)}/${userUuid}/permission-set-assignments`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function removePermissionSetAssignment(
  companyUuid: string,
  userUuid: string,
  assignmentUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.delete<ApiSuccessResponse<null>>(
    `${baseUrl(companyUuid)}/${userUuid}/permission-set-assignments/${assignmentUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}
