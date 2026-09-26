"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { listImportHistory } from "../api/master-data-upload.api"
import { masterUploadKeys } from "../api/master-data-upload-keys"
import type {
  ImportHistoryParams,
  MasterDataType,
} from "../api/master-data-upload.types"

export function useImportHistory(
  companyUuid: string,
  type: MasterDataType,
  params?: ImportHistoryParams
) {
  return useQuery({
    queryKey: masterUploadKeys.history(companyUuid, type, params),
    queryFn: () => listImportHistory(type, companyUuid, params),
    placeholderData: keepPreviousData,
  })
}
