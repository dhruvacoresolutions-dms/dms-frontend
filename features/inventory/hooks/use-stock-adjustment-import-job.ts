"use client"

import { useQuery } from "@tanstack/react-query"
import { getStockAdjustmentImportJob } from "../api/stock-adjustment-import.api"
import { stockAdjustmentKeys } from "../api/inventory-keys"

export function useStockAdjustmentImportJob(
  companyUuid: string,
  jobUuid: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: stockAdjustmentKeys.importDetail(companyUuid, jobUuid),
    queryFn: () => getStockAdjustmentImportJob(companyUuid, jobUuid),
    enabled: !!companyUuid && !!jobUuid && (options?.enabled ?? true),
  })
}
