"use client"

import { useQuery } from "@tanstack/react-query"
import { getProductFieldTemplate } from "../api/product-field-template.api"
import { productFieldTemplateKeys } from "../api/product-field-template-keys"

export function useProductFieldTemplate(
  companyUuid: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: productFieldTemplateKeys.template(companyUuid),
    queryFn: () => getProductFieldTemplate(companyUuid),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
