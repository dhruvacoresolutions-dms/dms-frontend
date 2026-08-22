export const designationKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "designations"] as const,
  lists: (companyUuid: string) =>
    [...designationKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...designationKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...designationKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, designationUuid: string) =>
    [...designationKeys.details(companyUuid), designationUuid] as const,
} as const
