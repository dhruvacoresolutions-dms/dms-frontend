export const auditKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "rbac-audit-events"] as const,
  lists: (companyUuid: string) =>
    [...auditKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...auditKeys.lists(companyUuid), params] as const,
} as const
