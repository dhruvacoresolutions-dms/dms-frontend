"use client"

import { useQuery } from "@tanstack/react-query"
import { getProductCategory } from "../api/product-category.api"
import { productCategoryKeys } from "../api/product-category-keys"

export function useProductCategory(companyUuid: string, categoryUuid: string) {
  return useQuery({
    queryKey: productCategoryKeys.detail(companyUuid, categoryUuid),
    queryFn: () => getProductCategory(companyUuid, categoryUuid),
    enabled: !!companyUuid && !!categoryUuid,
  })
}
