export const productBrandKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "product-brands"] as const,
  lists: (companyUuid: string) =>
    [...productBrandKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...productBrandKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...productBrandKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, brandUuid: string) =>
    [...productBrandKeys.details(companyUuid), brandUuid] as const,
} as const
