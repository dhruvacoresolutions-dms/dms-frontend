"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { reviewApproveStockAdjustment } from "../api/stock-adjustment.api"
import { stockAdjustmentKeys, stockSummaryKeys } from "../api/inventory-keys"
import type { StockDecisionRequest } from "../api/inventory.types"

export function useApproveStockAdjustment(
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
      reviewApproveStockAdjustment(
        companyUuid,
        distributorUuid,
        documentUuid,
        input
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: stockAdjustmentKeys.lists(companyUuid, distributorUuid),
      })
      queryClient.invalidateQueries({
        queryKey: stockAdjustmentKeys.detail(
          companyUuid,
          distributorUuid,
          variables.documentUuid
        ),
      })
      queryClient.invalidateQueries({
        queryKey: stockSummaryKeys.all(companyUuid, distributorUuid),
      })
      queryClient.invalidateQueries({
        queryKey: stockAdjustmentKeys.notifications(
          companyUuid,
          distributorUuid
        ),
      })
    },
  })
}
