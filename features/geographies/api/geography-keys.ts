export const geographyKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "geographies"] as const,
  lists: (companyUuid: string) =>
    [...geographyKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...geographyKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...geographyKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, geographyUuid: string) =>
    [...geographyKeys.details(companyUuid), geographyUuid] as const,
} as const
