export const relationshipTypeKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "relationship-types"] as const,
  lists: (companyUuid: string) =>
    [...relationshipTypeKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...relationshipTypeKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...relationshipTypeKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, relationshipTypeUuid: string) =>
    [...relationshipTypeKeys.details(companyUuid), relationshipTypeUuid] as const,
} as const
