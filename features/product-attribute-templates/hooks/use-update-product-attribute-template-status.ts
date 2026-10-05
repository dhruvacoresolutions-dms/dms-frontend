"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProductAttributeTemplateStatus } from "../api/product-attribute-template.api"
import { productAttributeTemplateKeys } from "../api/product-attribute-template-keys"
import type { UpdateProductAttributeTemplateStatusRequest } from "../api/product-attribute-template.types"

export function useUpdateProductAttributeTemplateStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      attributeTemplateUuid,
      input,
    }: {
      attributeTemplateUuid: string
      input: UpdateProductAttributeTemplateStatusRequest
    }) =>
      updateProductAttributeTemplateStatus(companyUuid, attributeTemplateUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: productAttributeTemplateKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: productAttributeTemplateKeys.detail(
          companyUuid,
          variables.attributeTemplateUuid
        ),
      })
    },
  })
}
