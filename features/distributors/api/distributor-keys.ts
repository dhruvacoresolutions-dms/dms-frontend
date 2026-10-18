export const distributorKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "distributors"] as const,
  lists: (companyUuid: string) =>
    [...distributorKeys.all(companyUuid), "list"] as const,
  list: (companyUuid: string, params?: Record<string, unknown>) =>
    [...distributorKeys.lists(companyUuid), params] as const,
  details: (companyUuid: string) =>
    [...distributorKeys.all(companyUuid), "detail"] as const,
  detail: (companyUuid: string, distributorUuid: string) =>
    [...distributorKeys.details(companyUuid), distributorUuid] as const,

  branches: (companyUuid: string, distributorUuid: string) =>
    [...distributorKeys.detail(companyUuid, distributorUuid), "branches"] as const,
  branchList: (
    companyUuid: string,
    distributorUuid: string,
    params?: Record<string, unknown>
  ) =>
    [...distributorKeys.branches(companyUuid, distributorUuid), params] as const,

  licenses: (companyUuid: string, distributorUuid: string) =>
    [...distributorKeys.detail(companyUuid, distributorUuid), "licenses"] as const,
  licenseList: (
    companyUuid: string,
    distributorUuid: string,
    params?: Record<string, unknown>
  ) =>
    [...distributorKeys.licenses(companyUuid, distributorUuid), params] as const,

  bank: (companyUuid: string, distributorUuid: string) =>
    [...distributorKeys.detail(companyUuid, distributorUuid), "bank-account"] as const,

  login: (companyUuid: string, distributorUuid: string) =>
    [...distributorKeys.detail(companyUuid, distributorUuid), "login"] as const,

  imports: (companyUuid: string) =>
    [...distributorKeys.all(companyUuid), "imports"] as const,
  importList: (companyUuid: string, params?: Record<string, unknown>) =>
    [...distributorKeys.imports(companyUuid), "list", params] as const,
  importDetail: (companyUuid: string, jobUuid: string) =>
    [...distributorKeys.imports(companyUuid), "detail", jobUuid] as const,
} as const

export const distributorReferenceKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "distributor-references"] as const,
  lists: (companyUuid: string, kind: string) =>
    [...distributorReferenceKeys.all(companyUuid), kind, "list"] as const,
  list: (companyUuid: string, kind: string, params?: Record<string, unknown>) =>
    [...distributorReferenceKeys.lists(companyUuid, kind), params] as const,
  details: (companyUuid: string, kind: string) =>
    [...distributorReferenceKeys.all(companyUuid), kind, "detail"] as const,
  detail: (companyUuid: string, kind: string, uuid: string) =>
    [...distributorReferenceKeys.details(companyUuid, kind), uuid] as const,
} as const
