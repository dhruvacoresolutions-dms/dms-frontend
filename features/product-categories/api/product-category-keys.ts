export const productCategoryKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "product-categories"] as const,
  lists: (companyUuid: string) =>
    [...productCategoryKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...productCategoryKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...productCategoryKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, categoryUuid: string) =>
    [...productCategoryKeys.details(companyUuid), categoryUuid] as const,
} as const
