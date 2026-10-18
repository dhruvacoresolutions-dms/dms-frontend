export const supplierKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "suppliers"] as const,
  lists: (companyUuid: string) =>
    [...supplierKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...supplierKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...supplierKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, supplierUuid: string) =>
    [...supplierKeys.details(companyUuid), supplierUuid] as const,
  imports: (companyUuid: string) =>
    [...supplierKeys.all(companyUuid), "imports"] as const,
  importList: (companyUuid: string, params?: Record<string, unknown>) =>
    [...supplierKeys.imports(companyUuid), "list", params] as const,
  importDetail: (companyUuid: string, jobUuid: string) =>
    [...supplierKeys.imports(companyUuid), "detail", jobUuid] as const,
} as const
