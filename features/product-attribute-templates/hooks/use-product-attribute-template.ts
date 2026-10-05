"use client"

import { useQuery } from "@tanstack/react-query"
import { getProductAttributeTemplate } from "../api/product-attribute-template.api"
import { productAttributeTemplateKeys } from "../api/product-attribute-template-keys"

export function useProductAttributeTemplate(
  companyUuid: string,
  attributeTemplateUuid: string
) {
  return useQuery({
    queryKey: productAttributeTemplateKeys.detail(companyUuid, attributeTemplateUuid),
    queryFn: () => getProductAttributeTemplate(companyUuid, attributeTemplateUuid),
    enabled: !!companyUuid && !!attributeTemplateUuid,
  })
}
