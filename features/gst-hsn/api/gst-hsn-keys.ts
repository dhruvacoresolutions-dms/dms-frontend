export const gstHsnKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "gst-hsn"] as const,
  lists: (companyUuid: string) =>
    [...gstHsnKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...gstHsnKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...gstHsnKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, hsnUuid: string) =>
    [...gstHsnKeys.details(companyUuid), hsnUuid] as const,
} as const
