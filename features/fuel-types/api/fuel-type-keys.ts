export const fuelTypeKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "fuel-types"] as const,
  lists: (companyUuid: string) =>
    [...fuelTypeKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...fuelTypeKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...fuelTypeKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, fuelTypeUuid: string) =>
    [...fuelTypeKeys.details(companyUuid), fuelTypeUuid] as const,
} as const
