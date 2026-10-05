export const vehicleVariantKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "vehicle-variants"] as const,
  lists: (companyUuid: string) =>
    [...vehicleVariantKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...vehicleVariantKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...vehicleVariantKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, variantUuid: string) =>
    [...vehicleVariantKeys.details(companyUuid), variantUuid] as const,
} as const
