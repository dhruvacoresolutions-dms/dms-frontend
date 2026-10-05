"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProductBrand } from "../api/product-brand.api"
import { productBrandKeys } from "../api/product-brand-keys"
import type { UpdateProductBrandRequest } from "../api/product-brand.types"

export function useUpdateProductBrand(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      brandUuid,
      input,
    }: {
      brandUuid: string
      input: UpdateProductBrandRequest
    }) => updateProductBrand(companyUuid, brandUuid, input),
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
