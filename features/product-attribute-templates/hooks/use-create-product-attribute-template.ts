"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProductAttributeTemplate } from "../api/product-attribute-template.api"
import { productAttributeTemplateKeys } from "../api/product-attribute-template-keys"
import type { CreateProductAttributeTemplateRequest } from "../api/product-attribute-template.types"

export function useCreateProductAttributeTemplate(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductAttributeTemplateRequest) =>
      createProductAttributeTemplate(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productAttributeTemplateKeys.lists(companyUuid),
      })
    },
  })
}
