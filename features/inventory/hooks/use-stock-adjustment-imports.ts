"use client"

import { useQuery } from "@tanstack/react-query"
import { listStockAdjustmentImports } from "../api/stock-adjustment-import.api"
import { stockAdjustmentKeys } from "../api/inventory-keys"
import type { StockImportHistoryParams } from "../api/inventory.types"

export function useStockAdjustmentImports(
  companyUuid: string,
  params?: StockImportHistoryParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: stockAdjustmentKeys.importList(companyUuid, params),
    queryFn: () => listStockAdjustmentImports(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
