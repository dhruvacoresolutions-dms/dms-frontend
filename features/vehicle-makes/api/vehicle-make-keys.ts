export const vehicleMakeKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "vehicle-makes"] as const,
  lists: (companyUuid: string) =>
    [...vehicleMakeKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...vehicleMakeKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...vehicleMakeKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, makeUuid: string) =>
    [...vehicleMakeKeys.details(companyUuid), makeUuid] as const,
} as const
