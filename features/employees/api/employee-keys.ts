export const employeeKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "employees"] as const,
  lists: (companyUuid: string) =>
    [...employeeKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...employeeKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...employeeKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, employeeUuid: string) =>
    [...employeeKeys.details(companyUuid), employeeUuid] as const,
  geographies: (companyUuid: string, employeeUuid: string) =>
    [...employeeKeys.detail(companyUuid, employeeUuid), "geographies"] as const,
} as const
