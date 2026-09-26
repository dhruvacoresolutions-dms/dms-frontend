"use client"

import { useQuery } from "@tanstack/react-query"
import { getUnifiedImportJob } from "../api/master-data-upload.api"
import { masterUploadKeys } from "../api/master-data-upload-keys"
import type { MasterDataType } from "../api/master-data-upload.types"

const POLL_INTERVAL_MS = 2500

/**
 * Polls the import-job detail until a terminal state is reached
 * (`COMPLETED` / `FAILED` / `SUCCEEDED`, via status or importState),
 * then stops automatically.
 */
export function useImportJob(
  companyUuid: string,
  type: MasterDataType,
  jobUuid: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: jobUuid
      ? masterUploadKeys.job(companyUuid, type, jobUuid)
      : ["companies", companyUuid, "master-upload", "job", "idle"],
    queryFn: () => getUnifiedImportJob(type, companyUuid, jobUuid as string),
    enabled: enabled && !!jobUuid,
    refetchInterval: (query) => {
      const job = query.state.data
      if (!job) return POLL_INTERVAL_MS
      return job.terminal ? false : POLL_INTERVAL_MS
    },
    retry: 2,
  })
}
