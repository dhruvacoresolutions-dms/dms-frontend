export const productKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "products"] as const,
  lists: (companyUuid: string) =>
    [...productKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...productKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...productKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, productUuid: string) =>
    [...productKeys.details(companyUuid), productUuid] as const,
  priceTypes: (companyUuid: string) =>
    [...productKeys.all(companyUuid), "price-types"] as const,
  prices: (companyUuid: string, productUuid: string) =>
    [...productKeys.detail(companyUuid, productUuid), "prices"] as const,
  priceList: (
    companyUuid: string,
    productUuid: string,
    params?: Record<string, unknown>
  ) => [...productKeys.prices(companyUuid, productUuid), params] as const,
  batches: (companyUuid: string, productUuid: string) =>
    [...productKeys.detail(companyUuid, productUuid), "batches"] as const,
  batchList: (
    companyUuid: string,
    productUuid: string,
    params?: Record<string, unknown>
  ) => [...productKeys.batches(companyUuid, productUuid), params] as const,
  gstMappings: (
    companyUuid: string,
    productUuid: string,
    params?: Record<string, unknown>
  ) =>
    [
      ...productKeys.detail(companyUuid, productUuid),
      "gst-mappings",
      params,
    ] as const,
  relationships: (
    companyUuid: string,
    productUuid: string,
    params?: Record<string, unknown>
  ) =>
    [
      ...productKeys.detail(companyUuid, productUuid),
      "relationships",
      params,
    ] as const,
  fitments: (
    companyUuid: string,
    productUuid: string,
    params?: Record<string, unknown>
  ) =>
    [
      ...productKeys.detail(companyUuid, productUuid),
      "fitments",
      params,
    ] as const,
  geographyMappings: (
    companyUuid: string,
    productUuid: string,
    params?: Record<string, unknown>
  ) =>
    [
      ...productKeys.detail(companyUuid, productUuid),
      "geographies",
      params,
    ] as const,
} as const
