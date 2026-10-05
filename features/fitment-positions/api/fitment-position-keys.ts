export const fitmentPositionKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "fitment-positions"] as const,
  lists: (companyUuid: string) =>
    [...fitmentPositionKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...fitmentPositionKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...fitmentPositionKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, fitmentPositionUuid: string) =>
    [...fitmentPositionKeys.details(companyUuid), fitmentPositionUuid] as const,
} as const
