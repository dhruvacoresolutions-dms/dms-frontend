"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProductAttributeOption } from "../api/product-attribute-template.api"
import { productAttributeTemplateKeys } from "../api/product-attribute-template-keys"
import type { UpdateProductAttributeOptionRequest } from "../api/product-attribute-template.types"

export function useUpdateProductAttributeOption(
  companyUuid: string,
  attributeTemplateUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      optionUuid,
      input,
    }: {
      optionUuid: string
      input: UpdateProductAttributeOptionRequest
    }) =>
      updateProductAttributeOption(companyUuid, attributeTemplateUuid, optionUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productAttributeTemplateKeys.options(companyUuid, attributeTemplateUuid),
      })
    },
  })
}
