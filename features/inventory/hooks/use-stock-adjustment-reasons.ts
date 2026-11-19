"use client"

import { useQuery } from "@tanstack/react-query"
import { getStockAdjustmentReasons } from "../api/stock-adjustment.api"
import { stockAdjustmentKeys } from "../api/inventory-keys"

export function useStockAdjustmentReasons(
  companyUuid: string,
  distributorUuid: string
) {
  return useQuery({
    queryKey: stockAdjustmentKeys.reasons(companyUuid, distributorUuid),
    queryFn: () => getStockAdjustmentReasons(companyUuid, distributorUuid),
    enabled: !!companyUuid && !!distributorUuid,
    staleTime: 5 * 60 * 1000,
  })
}
