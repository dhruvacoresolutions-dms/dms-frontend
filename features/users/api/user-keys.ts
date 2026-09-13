import type { AccessAssignmentListParams } from "./user.types"

export const userKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "users"] as const,
  lists: (companyUuid: string) =>
    [...userKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...userKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...userKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, userUuid: string) =>
    [...userKeys.details(companyUuid), userUuid] as const,
  effectiveAccess: (companyUuid: string, userUuid: string) =>
    [...userKeys.detail(companyUuid, userUuid), "effective-access"] as const,
  roleAssignments: (
    companyUuid: string,
    userUuid: string,
    params?: AccessAssignmentListParams
  ) =>
    [...userKeys.detail(companyUuid, userUuid), "role-assignments", params] as const,
  permissionSetAssignments: (
    companyUuid: string,
    userUuid: string,
    params?: AccessAssignmentListParams
  ) =>
    [...userKeys.detail(companyUuid, userUuid), "permission-set-assignments", params] as const,
} as const
