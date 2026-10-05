"use client"

import { useQuery } from "@tanstack/react-query"
import { getProductAttributeTemplates } from "../api/product-attribute-template.api"
import { productAttributeTemplateKeys } from "../api/product-attribute-template-keys"
import type { ProductAttributeTemplateListParams } from "../api/product-attribute-template.types"

export function useProductAttributeTemplates(
  companyUuid: string,
  params?: ProductAttributeTemplateListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: productAttributeTemplateKeys.list(companyUuid, params),
    queryFn: () => getProductAttributeTemplates(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
