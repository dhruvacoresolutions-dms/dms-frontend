"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProductAttributeOptionStatus } from "../api/product-attribute-template.api"
import { productAttributeTemplateKeys } from "../api/product-attribute-template-keys"
import type { UpdateProductAttributeOptionStatusRequest } from "../api/product-attribute-template.types"

export function useUpdateProductAttributeOptionStatus(
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
      input: UpdateProductAttributeOptionStatusRequest
    }) =>
      updateProductAttributeOptionStatus(
        companyUuid,
        attributeTemplateUuid,
        optionUuid,
        input
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productAttributeTemplateKeys.options(companyUuid, attributeTemplateUuid),
      })
    },
  })
}
