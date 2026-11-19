"use client"

import { useQuery } from "@tanstack/react-query"
import { getAvailableQuantity } from "../api/stock-summary.api"
import { stockSummaryKeys } from "../api/inventory-keys"
import type { StockTypeCode } from "../api/inventory.types"

export function useAvailableQuantity(
  companyUuid: string,
  distributorUuid: string,
  params: {
    godown?: string
    product?: string
    stockType?: StockTypeCode
    batch?: string
  },
  options?: { enabled?: boolean }
) {
  const enabled =
    !!companyUuid &&
    !!distributorUuid &&
    !!params.godown &&
    !!params.product &&
    !!params.stockType &&
    (options?.enabled ?? true)

  return useQuery({
    queryKey: stockSummaryKeys.available(
      companyUuid,
      distributorUuid,
      params
    ),
    queryFn: () =>
      getAvailableQuantity(companyUuid, distributorUuid, {
        godown: params.godown as string,
        product: params.product as string,
        stockType: params.stockType as StockTypeCode,
        batch: params.batch,
      }),
    enabled,
    staleTime: 15_000,
  })
}
