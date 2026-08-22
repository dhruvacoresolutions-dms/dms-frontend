export const companyKeys = {
  all: ["companies"] as const,
  lists: () => [...companyKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...companyKeys.lists(), params] as const,
  details: () => [...companyKeys.all, "detail"] as const,
  detail: (companyUuid: string) =>
    [...companyKeys.details(), companyUuid] as const,
  addresses: (companyUuid: string) =>
    [...companyKeys.detail(companyUuid), "addresses"] as const,
  features: (companyUuid: string) =>
    [...companyKeys.detail(companyUuid), "features"] as const,
} as const
