export const gstTaxCodeKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "gst-tax-codes"] as const,
  lists: (companyUuid: string) =>
    [...gstTaxCodeKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...gstTaxCodeKeys.lists(companyUuid), params] as const,
  versions: (companyUuid: string, taxCode: string) =>
    [...gstTaxCodeKeys.all(companyUuid), "versions", taxCode] as const,
} as const
