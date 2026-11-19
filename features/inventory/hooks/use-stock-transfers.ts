"use client"

import { useQuery } from "@tanstack/react-query"
import { getStockTransfers } from "../api/stock-transfer.api"
import { stockTransferKeys } from "../api/inventory-keys"
import type { StockTransferListParams } from "../api/inventory.types"

export function useStockTransfers(
  companyUuid: string,
  distributorUuid: string,
  params?: StockTransferListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: stockTransferKeys.list(companyUuid, distributorUuid, params),
    queryFn: () => getStockTransfers(companyUuid, distributorUuid, params),
    enabled:
      !!companyUuid && !!distributorUuid && (options?.enabled ?? true),
  })
}
