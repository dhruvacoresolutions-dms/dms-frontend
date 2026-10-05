export const productAttributeTemplateKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "product-attribute-templates"] as const,
  lists: (companyUuid: string) =>
    [...productAttributeTemplateKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...productAttributeTemplateKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...productAttributeTemplateKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, attributeTemplateUuid: string) =>
    [...productAttributeTemplateKeys.details(companyUuid), attributeTemplateUuid] as const,
  options: (companyUuid: string, attributeTemplateUuid: string) =>
    [...productAttributeTemplateKeys.detail(companyUuid, attributeTemplateUuid), "options"] as const,
} as const
