"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProductFieldTemplate } from "../api/product-field-template.api"
import { productFieldTemplateKeys } from "../api/product-field-template-keys"
import type { UpdateProductFieldTemplateRequest } from "../api/product-field-template.types"

export function useUpdateProductFieldTemplate(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateProductFieldTemplateRequest) =>
      updateProductFieldTemplate(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productFieldTemplateKeys.template(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: productFieldTemplateKeys.effective(companyUuid),
      })
    },
  })
}
