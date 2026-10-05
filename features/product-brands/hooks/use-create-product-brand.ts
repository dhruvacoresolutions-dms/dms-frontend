"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProductBrand } from "../api/product-brand.api"
import { productBrandKeys } from "../api/product-brand-keys"
import type { CreateProductBrandRequest } from "../api/product-brand.types"

export function useCreateProductBrand(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductBrandRequest) =>
      createProductBrand(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productBrandKeys.lists(companyUuid),
      })
    },
  })
}
