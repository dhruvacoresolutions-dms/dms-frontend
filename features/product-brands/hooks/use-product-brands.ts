"use client"

import { useQuery } from "@tanstack/react-query"
import { getProductBrands } from "../api/product-brand.api"
import { productBrandKeys } from "../api/product-brand-keys"
import type { ProductBrandListParams } from "../api/product-brand.types"

export function useProductBrands(
  companyUuid: string,
  params?: ProductBrandListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: productBrandKeys.list(companyUuid, params),
    queryFn: () => getProductBrands(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
