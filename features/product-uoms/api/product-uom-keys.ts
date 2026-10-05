export const productUomKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "product-uoms"] as const,
  lists: (companyUuid: string) =>
    [...productUomKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...productUomKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...productUomKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, uomUuid: string) =>
    [...productUomKeys.details(companyUuid), uomUuid] as const,
} as const
