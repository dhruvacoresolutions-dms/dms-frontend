export const gstTaxStructureKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "gst-tax-structures"] as const,
  lists: (companyUuid: string) =>
    [...gstTaxStructureKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...gstTaxStructureKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...gstTaxStructureKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, taxStructureUuid: string) =>
    [...gstTaxStructureKeys.details(companyUuid), taxStructureUuid] as const,
} as const
