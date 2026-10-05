export const productFieldTemplateKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "product-field-template"] as const,
  template: (companyUuid: string) =>
    [...productFieldTemplateKeys.all(companyUuid), "template"] as const,
  effective: (companyUuid: string) =>
    [...productFieldTemplateKeys.all(companyUuid), "effective"] as const,
} as const
