"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProductCategoryStatus } from "../api/product-category.api"
import { productCategoryKeys } from "../api/product-category-keys"
import type { UpdateProductCategoryStatusRequest } from "../api/product-category.types"

export function useUpdateProductCategoryStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      categoryUuid,
      input,
    }: {
      categoryUuid: string
      input: UpdateProductCategoryStatusRequest
    }) => updateProductCategoryStatus(companyUuid, categoryUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.detail(companyUuid, variables.categoryUuid),
      })
    },
  })
}
