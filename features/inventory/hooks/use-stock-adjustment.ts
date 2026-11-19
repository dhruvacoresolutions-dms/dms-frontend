"use client"

import { useQuery } from "@tanstack/react-query"
import { getStockAdjustment } from "../api/stock-adjustment.api"
import { stockAdjustmentKeys } from "../api/inventory-keys"

export function useStockAdjustment(
  companyUuid: string,
  distributorUuid: string,
  documentUuid: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: stockAdjustmentKeys.detail(
      companyUuid,
      distributorUuid,
      documentUuid
    ),
    queryFn: () =>
      getStockAdjustment(companyUuid, distributorUuid, documentUuid),
    enabled:
      !!companyUuid &&
      !!distributorUuid &&
      !!documentUuid &&
      (options?.enabled ?? true),
  })
}
