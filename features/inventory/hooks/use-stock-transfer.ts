"use client"

import { useQuery } from "@tanstack/react-query"
import { getStockTransfer } from "../api/stock-transfer.api"
import { stockTransferKeys } from "../api/inventory-keys"

export function useStockTransfer(
  companyUuid: string,
  distributorUuid: string,
  documentUuid: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: stockTransferKeys.detail(
      companyUuid,
      distributorUuid,
      documentUuid
    ),
    queryFn: () =>
      getStockTransfer(companyUuid, distributorUuid, documentUuid),
    enabled:
      !!companyUuid &&
      !!distributorUuid &&
      !!documentUuid &&
      (options?.enabled ?? true),
  })
}
