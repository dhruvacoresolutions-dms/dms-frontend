"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { uploadStockAdjustmentImport } from "../api/stock-adjustment-import.api"
import {
  stockAdjustmentKeys,
  stockSummaryKeys,
} from "../api/inventory-keys"

export function useUploadStockAdjustmentImport(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) =>
      uploadStockAdjustmentImport(companyUuid, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: stockAdjustmentKeys.imports(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: stockAdjustmentKeys.lists(companyUuid, distributorUuid),
      })
      queryClient.invalidateQueries({
        queryKey: stockSummaryKeys.all(companyUuid, distributorUuid),
      })
    },
  })
}
