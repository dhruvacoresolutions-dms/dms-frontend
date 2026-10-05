"use client"

import { useQuery } from "@tanstack/react-query"
import { getProducts } from "../api/product.api"
import { productKeys } from "../api/product-keys"
import type { ProductListParams } from "../api/product.types"

export function useProducts(
  companyUuid: string,
  params?: ProductListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: productKeys.list(companyUuid, params),
    queryFn: () => getProducts(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
