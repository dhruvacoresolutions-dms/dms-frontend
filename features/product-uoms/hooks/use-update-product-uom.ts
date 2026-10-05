"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProductUom } from "../api/product-uom.api"
import { productUomKeys } from "../api/product-uom-keys"
import type { UpdateProductUomRequest } from "../api/product-uom.types"

export function useUpdateProductUom(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      uomUuid,
      input,
    }: {
      uomUuid: string
      input: UpdateProductUomRequest
    }) => updateProductUom(companyUuid, uomUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: productUomKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: productUomKeys.detail(companyUuid, variables.uomUuid),
      })
    },
  })
}
