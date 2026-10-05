"use client"

import { useQuery } from "@tanstack/react-query"
import { getProductUoms } from "../api/product-uom.api"
import { productUomKeys } from "../api/product-uom-keys"
import type { ProductUomListParams } from "../api/product-uom.types"

export function useProductUoms(
  companyUuid: string,
  params?: ProductUomListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: productUomKeys.list(companyUuid, params),
    queryFn: () => getProductUoms(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
