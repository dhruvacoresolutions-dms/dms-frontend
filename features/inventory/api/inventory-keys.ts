export const godownKeys = {
  all: (companyUuid: string, distributorUuid: string) =>
    ["companies", companyUuid, "distributors", distributorUuid, "godowns"] as const,
  lists: (companyUuid: string, distributorUuid: string) =>
    [...godownKeys.all(companyUuid, distributorUuid), "list"] as const,
  list: (
    companyUuid: string,
    distributorUuid: string,
    params?: Record<string, unknown>
  ) => [...godownKeys.lists(companyUuid, distributorUuid), params] as const,
  details: (companyUuid: string, distributorUuid: string) =>
    [...godownKeys.all(companyUuid, distributorUuid), "detail"] as const,
  detail: (companyUuid: string, distributorUuid: string, godownUuid: string) =>
    [...godownKeys.details(companyUuid, distributorUuid), godownUuid] as const,
} as const

export const stockAdjustmentKeys = {
  all: (companyUuid: string, distributorUuid: string) =>
    [
      "companies",
      companyUuid,
      "distributors",
      distributorUuid,
      "stock-adjustments",
    ] as const,
  lists: (companyUuid: string, distributorUuid: string) =>
    [...stockAdjustmentKeys.all(companyUuid, distributorUuid), "list"] as const,
  list: (
    companyUuid: string,
    distributorUuid: string,
    params?: Record<string, unknown>
  ) =>
    [...stockAdjustmentKeys.lists(companyUuid, distributorUuid), params] as const,
  details: (companyUuid: string, distributorUuid: string) =>
    [...stockAdjustmentKeys.all(companyUuid, distributorUuid), "detail"] as const,
  detail: (
    companyUuid: string,
    distributorUuid: string,
    documentUuid: string
  ) =>
    [
      ...stockAdjustmentKeys.details(companyUuid, distributorUuid),
      documentUuid,
    ] as const,
  reasons: (companyUuid: string, distributorUuid: string) =>
    [...stockAdjustmentKeys.all(companyUuid, distributorUuid), "reasons"] as const,
  notifications: (
    companyUuid: string,
    distributorUuid: string,
    params?: Record<string, unknown>
  ) =>
    [
      ...stockAdjustmentKeys.all(companyUuid, distributorUuid),
      "notifications",
      params,
    ] as const,
  imports: (companyUuid: string) =>
    ["companies", companyUuid, "stock-adjustment-imports"] as const,
  importList: (companyUuid: string, params?: Record<string, unknown>) =>
    [...stockAdjustmentKeys.imports(companyUuid), "list", params] as const,
  importDetail: (companyUuid: string, jobUuid: string) =>
    [...stockAdjustmentKeys.imports(companyUuid), "detail", jobUuid] as const,
} as const

export const stockTransferKeys = {
  all: (companyUuid: string, distributorUuid: string) =>
    [
      "companies",
      companyUuid,
      "distributors",
      distributorUuid,
      "stock-transfers",
    ] as const,
  lists: (companyUuid: string, distributorUuid: string) =>
    [...stockTransferKeys.all(companyUuid, distributorUuid), "list"] as const,
  list: (
    companyUuid: string,
    distributorUuid: string,
    params?: Record<string, unknown>
  ) => [...stockTransferKeys.lists(companyUuid, distributorUuid), params] as const,
  details: (companyUuid: string, distributorUuid: string) =>
    [...stockTransferKeys.all(companyUuid, distributorUuid), "detail"] as const,
  detail: (
    companyUuid: string,
    distributorUuid: string,
    documentUuid: string
  ) =>
    [
      ...stockTransferKeys.details(companyUuid, distributorUuid),
      documentUuid,
    ] as const,
} as const

export const stockSummaryKeys = {
  all: (companyUuid: string, distributorUuid: string) =>
    [
      "companies",
      companyUuid,
      "distributors",
      distributorUuid,
      "stock-summary",
    ] as const,
  list: (
    companyUuid: string,
    distributorUuid: string,
    params?: Record<string, unknown>
  ) => [...stockSummaryKeys.all(companyUuid, distributorUuid), params] as const,
  available: (
    companyUuid: string,
    distributorUuid: string,
    params?: Record<string, unknown>
  ) =>
    [
      ...stockSummaryKeys.all(companyUuid, distributorUuid),
      "available",
      params,
    ] as const,
  products: (
    companyUuid: string,
    distributorUuid: string,
    params?: Record<string, unknown>
  ) =>
    [
      ...stockSummaryKeys.all(companyUuid, distributorUuid),
      "products",
      params,
    ] as const,
  stockTypes: (companyUuid: string, distributorUuid: string) =>
    [...stockSummaryKeys.all(companyUuid, distributorUuid), "types"] as const,
} as const
