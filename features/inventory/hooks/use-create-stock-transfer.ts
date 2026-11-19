"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createStockTransfer } from "../api/stock-transfer.api"
import { stockSummaryKeys, stockTransferKeys } from "../api/inventory-keys"
import type { CreateStockTransferRequest } from "../api/inventory.types"

export function useCreateStockTransfer(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateStockTransferRequest) =>
      createStockTransfer(companyUuid, distributorUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: stockTransferKeys.lists(companyUuid, distributorUuid),
      })
      queryClient.invalidateQueries({
        queryKey: stockSummaryKeys.all(companyUuid, distributorUuid),
      })
    },
  })
}
