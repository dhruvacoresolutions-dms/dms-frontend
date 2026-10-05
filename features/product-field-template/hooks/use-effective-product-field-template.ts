"use client"

import { useQuery } from "@tanstack/react-query"
import { getEffectiveProductFieldTemplate } from "../api/product-field-template.api"
import { productFieldTemplateKeys } from "../api/product-field-template-keys"

export function useEffectiveProductFieldTemplate(
  companyUuid: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: productFieldTemplateKeys.effective(companyUuid),
    queryFn: () => getEffectiveProductFieldTemplate(companyUuid),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
