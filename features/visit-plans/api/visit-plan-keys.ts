export const visitPlanKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "visit-plans"] as const,
  lists: (companyUuid: string) =>
    [...visitPlanKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...visitPlanKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...visitPlanKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, planUuid: string) =>
    [...visitPlanKeys.details(companyUuid), planUuid] as const,
  unplanned: (companyUuid: string) =>
    [...visitPlanKeys.all(companyUuid), "unplanned-customers"] as const,
  unplannedList: (companyUuid: string, params?: Record<string, unknown>) =>
    [...visitPlanKeys.unplanned(companyUuid), "list", params] as const,
  unplannedSelectAll: (companyUuid: string, params?: Record<string, unknown>) =>
    [...visitPlanKeys.unplanned(companyUuid), "select-all", params] as const,
} as const
