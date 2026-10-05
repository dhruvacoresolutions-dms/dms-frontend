"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProductCategory } from "../api/product-category.api"
import { productCategoryKeys } from "../api/product-category-keys"
import type { UpdateProductCategoryRequest } from "../api/product-category.types"

export function useUpdateProductCategory(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      categoryUuid,
      input,
    }: {
      categoryUuid: string
      input: UpdateProductCategoryRequest
    }) => updateProductCategory(companyUuid, categoryUuid, input),
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
