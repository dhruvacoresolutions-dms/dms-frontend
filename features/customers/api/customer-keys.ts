import type { CustomerMasterKind } from "./customer.types"

export const customerKeys = {
  all: (companyUuid: string) => ["companies", companyUuid, "customers"] as const,
  lists: (companyUuid: string) =>
    [...customerKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...customerKeys.lists(companyUuid), params] as const,
  countList: (companyUuid: string, lifecycleStatus?: string) =>
    [...customerKeys.lists(companyUuid), "count", lifecycleStatus ?? "ALL"] as const,
  details: (companyUuid: string) =>
    [...customerKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, customerUuid: string) =>
    [...customerKeys.details(companyUuid), customerUuid] as const,
  history: (companyUuid: string, customerUuid: string) =>
    [...customerKeys.detail(companyUuid, customerUuid), "history"] as const,
  bank: (companyUuid: string, customerUuid: string) =>
    [...customerKeys.detail(companyUuid, customerUuid), "bank"] as const,
  credit: (companyUuid: string, customerUuid: string) =>
    [...customerKeys.detail(companyUuid, customerUuid), "credit"] as const,
  kyc: (companyUuid: string, customerUuid: string) =>
    [...customerKeys.detail(companyUuid, customerUuid), "kyc-entries"] as const,
  bankEntries: (companyUuid: string, customerUuid: string) =>
    [
      ...customerKeys.detail(companyUuid, customerUuid),
      "bank-entries",
    ] as const,
  duplicate: (companyUuid: string, params?: Record<string, unknown>) =>
    [...customerKeys.all(companyUuid), "duplicate", params] as const,
} as const

export const customerMasterKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "customer-masters"] as const,
  types: (companyUuid: string) =>
    [...customerMasterKeys.all(companyUuid), "types"] as const,
  lookupTypes: (companyUuid: string) =>
    [...customerMasterKeys.all(companyUuid), "lookup-types"] as const,
  lists: (companyUuid: string, kind: CustomerMasterKind) =>
    [...customerMasterKeys.all(companyUuid), kind, "list"] as const,
  list: (
    companyUuid: string,
    kind: CustomerMasterKind,
    params?: Record<string, unknown>
  ) => [...customerMasterKeys.lists(companyUuid, kind), params] as const,
  details: (companyUuid: string, kind: CustomerMasterKind) =>
    [...customerMasterKeys.all(companyUuid), kind, "detail"] as const,
  detail: (companyUuid: string, kind: CustomerMasterKind, uuid: string) =>
    [...customerMasterKeys.details(companyUuid, kind), uuid] as const,
  options: (
    companyUuid: string,
    params?: Record<string, unknown>
  ) => [...customerMasterKeys.all(companyUuid), "options", params] as const,
} as const

export const customerPincodeKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "customer-pincode-mappings"] as const,
  lists: (companyUuid: string) =>
    [...customerPincodeKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...customerPincodeKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...customerPincodeKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, uuid: string) =>
    [...customerPincodeKeys.details(companyUuid), uuid] as const,
  resolve: (companyUuid: string, pincode: string) =>
    [...customerPincodeKeys.all(companyUuid), "resolve", pincode] as const,
  imports: (companyUuid: string) =>
    [...customerPincodeKeys.all(companyUuid), "imports"] as const,
  importList: (companyUuid: string, params?: Record<string, unknown>) =>
    [...customerPincodeKeys.imports(companyUuid), "list", params] as const,
  importDetail: (companyUuid: string, jobUuid: string) =>
    [...customerPincodeKeys.imports(companyUuid), "detail", jobUuid] as const,
} as const
