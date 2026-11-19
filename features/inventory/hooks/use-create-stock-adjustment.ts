"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createStockAdjustment } from "../api/stock-adjustment.api"
import { stockAdjustmentKeys, stockSummaryKeys } from "../api/inventory-keys"
import type { CreateStockAdjustmentRequest } from "../api/inventory.types"

export function useCreateStockAdjustment(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateStockAdjustmentRequest) =>
      createStockAdjustment(companyUuid, distributorUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: stockAdjustmentKeys.lists(companyUuid, distributorUuid),
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
