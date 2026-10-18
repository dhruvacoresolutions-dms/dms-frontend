"use client"

import { useQuery } from "@tanstack/react-query"
import { listDistributorImportHistory } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { DistributorImportHistoryParams } from "../api/distributor.types"

export function useDistributorImportHistory(
  companyUuid: string,
  params?: DistributorImportHistoryParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: distributorKeys.importList(companyUuid, params),
    queryFn: () => listDistributorImportHistory(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
