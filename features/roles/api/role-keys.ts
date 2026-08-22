export const roleKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "roles"] as const,
  lists: (companyUuid: string) =>
    [...roleKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string) =>
    [...roleKeys.lists(companyUuid)] as const,
  details: (companyUuid: string) =>
    [...roleKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, roleUuid: string) =>
    [...roleKeys.details(companyUuid), roleUuid] as const,
} as const
