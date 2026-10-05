"use client"

import { useQuery } from "@tanstack/react-query"
import { getProductAttributeOptions } from "../api/product-attribute-template.api"
import { productAttributeTemplateKeys } from "../api/product-attribute-template-keys"

export function useProductAttributeOptions(
  companyUuid: string,
  attributeTemplateUuid: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: productAttributeTemplateKeys.options(companyUuid, attributeTemplateUuid),
    queryFn: () => getProductAttributeOptions(companyUuid, attributeTemplateUuid),
    enabled: !!companyUuid && !!attributeTemplateUuid && (options?.enabled ?? true),
  })
}
