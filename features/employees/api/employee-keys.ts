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
  imports: (companyUuid: string) =>
    [...employeeKeys.all(companyUuid), "imports"] as const,
  importDetail: (companyUuid: string, importJobUuid: string) =>
    [...employeeKeys.imports(companyUuid), importJobUuid] as const,
  importRows: (companyUuid: string, importJobUuid: string) =>
    [...employeeKeys.importDetail(companyUuid, importJobUuid), "rows"] as const,
} as const
