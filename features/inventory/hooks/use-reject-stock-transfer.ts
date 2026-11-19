"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { rejectStockTransfer } from "../api/stock-transfer.api"
import { stockTransferKeys } from "../api/inventory-keys"
import type { StockDecisionRequest } from "../api/inventory.types"

export function useRejectStockTransfer(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      documentUuid,
      input,
    }: {
      documentUuid: string
      input: StockDecisionRequest
    }) =>
      rejectStockTransfer(companyUuid, distributorUuid, documentUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: stockTransferKeys.lists(companyUuid, distributorUuid),
      })
      queryClient.invalidateQueries({
        queryKey: stockTransferKeys.detail(
          companyUuid,
          distributorUuid,
          variables.documentUuid
        ),
      })
    },
  })
}
