"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProductCategory } from "../api/product-category.api"
import { productCategoryKeys } from "../api/product-category-keys"
import type { CreateProductCategoryRequest } from "../api/product-category.types"

export function useCreateProductCategory(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductCategoryRequest) =>
      createProductCategory(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.lists(companyUuid),
      })
    },
  })
}
