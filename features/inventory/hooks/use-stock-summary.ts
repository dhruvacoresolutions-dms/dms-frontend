"use client"

import { useQuery } from "@tanstack/react-query"
import { getStockSummary } from "../api/stock-summary.api"
import { stockSummaryKeys } from "../api/inventory-keys"
import type { StockSummaryParams } from "../api/inventory.types"

export function useStockSummary(
  companyUuid: string,
  distributorUuid: string,
  params?: StockSummaryParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: stockSummaryKeys.list(companyUuid, distributorUuid, params),
    queryFn: () => getStockSummary(companyUuid, distributorUuid, params),
    enabled:
      !!companyUuid && !!distributorUuid && (options?.enabled ?? true),
  })
}
