export const departmentKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "departments"] as const,
  lists: (companyUuid: string) =>
    [...departmentKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...departmentKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...departmentKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, departmentUuid: string) =>
    [...departmentKeys.details(companyUuid), departmentUuid] as const,
} as const
