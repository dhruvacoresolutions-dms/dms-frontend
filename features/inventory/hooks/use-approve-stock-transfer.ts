"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { approveStockTransfer } from "../api/stock-transfer.api"
import { stockSummaryKeys, stockTransferKeys } from "../api/inventory-keys"
import type { StockDecisionRequest } from "../api/inventory.types"

export function useApproveStockTransfer(
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
      approveStockTransfer(companyUuid, distributorUuid, documentUuid, input),
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
      queryClient.invalidateQueries({
        queryKey: stockSummaryKeys.all(companyUuid, distributorUuid),
      })
    },
  })
}
