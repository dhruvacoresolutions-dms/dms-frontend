export const coveragePlanKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "coverage-plans"] as const,
  lists: (companyUuid: string) =>
    [...coveragePlanKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...coveragePlanKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...coveragePlanKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, planUuid: string) =>
    [...coveragePlanKeys.details(companyUuid), planUuid] as const,
  dailyPlans: (companyUuid: string, planUuid: string) =>
    [...coveragePlanKeys.detail(companyUuid, planUuid), "daily-plans"] as const,
  dailyPlanList: (
    companyUuid: string,
    planUuid: string,
    params?: Record<string, unknown>
  ) => [...coveragePlanKeys.dailyPlans(companyUuid, planUuid), params] as const,
} as const
