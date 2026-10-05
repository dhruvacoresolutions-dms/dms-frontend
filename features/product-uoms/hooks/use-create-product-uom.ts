"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProductUom } from "../api/product-uom.api"
import { productUomKeys } from "../api/product-uom-keys"
import type { CreateProductUomRequest } from "../api/product-uom.types"

export function useCreateProductUom(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductUomRequest) =>
      createProductUom(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productUomKeys.lists(companyUuid),
      })
    },
  })
}
