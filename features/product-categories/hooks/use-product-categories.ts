"use client"

import { useQuery } from "@tanstack/react-query"
import { getProductCategories } from "../api/product-category.api"
import { productCategoryKeys } from "../api/product-category-keys"
import type { ProductCategoryListParams } from "../api/product-category.types"

export function useProductCategories(
  companyUuid: string,
  params?: ProductCategoryListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: productCategoryKeys.list(companyUuid, params),
    queryFn: () => getProductCategories(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
