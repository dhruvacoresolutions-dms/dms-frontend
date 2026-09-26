import type {
  ImportHistoryParams,
  MasterDataType,
} from "./master-data-upload.types"

export const masterUploadKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "master-upload"] as const,
  histories: (companyUuid: string) =>
    [...masterUploadKeys.all(companyUuid), "history"] as const,
  history: (
    companyUuid: string,
    type: MasterDataType,
    params?: ImportHistoryParams
  ) => [...masterUploadKeys.histories(companyUuid), type, params] as const,
  jobs: (companyUuid: string) =>
    [...masterUploadKeys.all(companyUuid), "job"] as const,
  job: (companyUuid: string, type: MasterDataType, jobUuid: string) =>
    [...masterUploadKeys.jobs(companyUuid), type, jobUuid] as const,
} as const
