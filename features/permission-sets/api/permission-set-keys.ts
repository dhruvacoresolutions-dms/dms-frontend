import type { PermissionSetListParams } from "./permission-set.types"

export const permissionSetKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "permission-sets"] as const,
  lists: (companyUuid: string) =>
    [...permissionSetKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: PermissionSetListParams) =>
    [...permissionSetKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...permissionSetKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, setUuid: string) =>
    [...permissionSetKeys.details(companyUuid), setUuid] as const,
} as const
