"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProductAttributeOption } from "../api/product-attribute-template.api"
import { productAttributeTemplateKeys } from "../api/product-attribute-template-keys"
import type { CreateProductAttributeOptionRequest } from "../api/product-attribute-template.types"

export function useCreateProductAttributeOption(
  companyUuid: string,
  attributeTemplateUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductAttributeOptionRequest) =>
      createProductAttributeOption(companyUuid, attributeTemplateUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productAttributeTemplateKeys.options(companyUuid, attributeTemplateUuid),
      })
    },
  })
}
