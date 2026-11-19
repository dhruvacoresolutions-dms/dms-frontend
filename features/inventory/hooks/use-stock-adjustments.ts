"use client"

import { useQuery } from "@tanstack/react-query"
import { getStockAdjustments } from "../api/stock-adjustment.api"
import { stockAdjustmentKeys } from "../api/inventory-keys"
import type { StockAdjustmentListParams } from "../api/inventory.types"

export function useStockAdjustments(
  companyUuid: string,
  distributorUuid: string,
  params?: StockAdjustmentListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: stockAdjustmentKeys.list(
      companyUuid,
      distributorUuid,
      params
    ),
    queryFn: () =>
      getStockAdjustments(companyUuid, distributorUuid, params),
    enabled:
      !!companyUuid && !!distributorUuid && (options?.enabled ?? true),
  })
}
