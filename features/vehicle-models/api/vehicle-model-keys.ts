export const vehicleModelKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "vehicle-models"] as const,
  lists: (companyUuid: string) =>
    [...vehicleModelKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...vehicleModelKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...vehicleModelKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, modelUuid: string) =>
    [...vehicleModelKeys.details(companyUuid), modelUuid] as const,
} as const
