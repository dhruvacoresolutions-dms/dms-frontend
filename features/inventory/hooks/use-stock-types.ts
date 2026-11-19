"use client"

import { useQuery } from "@tanstack/react-query"
import { getStockTypes } from "../api/stock-summary.api"
import { stockSummaryKeys } from "../api/inventory-keys"

export function useStockTypes(companyUuid: string, distributorUuid: string) {
  return useQuery({
    queryKey: stockSummaryKeys.stockTypes(companyUuid, distributorUuid),
    queryFn: () => getStockTypes(companyUuid, distributorUuid),
    enabled: !!companyUuid && !!distributorUuid,
    staleTime: 10 * 60 * 1000,
  })
}
