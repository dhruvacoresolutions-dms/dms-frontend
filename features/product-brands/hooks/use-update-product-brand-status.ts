"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProductBrandStatus } from "../api/product-brand.api"
import { productBrandKeys } from "../api/product-brand-keys"
import type { UpdateProductBrandStatusRequest } from "../api/product-brand.types"

export function useUpdateProductBrandStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      brandUuid,
      input,
    }: {
      brandUuid: string
      input: UpdateProductBrandStatusRequest
    }) => updateProductBrandStatus(companyUuid, brandUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: productBrandKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: productBrandKeys.detail(companyUuid, variables.brandUuid),
      })
    },
  })
}
