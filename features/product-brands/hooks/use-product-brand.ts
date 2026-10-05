"use client"

import { useQuery } from "@tanstack/react-query"
import { getProductBrand } from "../api/product-brand.api"
import { productBrandKeys } from "../api/product-brand-keys"

export function useProductBrand(companyUuid: string, brandUuid: string) {
  return useQuery({
    queryKey: productBrandKeys.detail(companyUuid, brandUuid),
    queryFn: () => getProductBrand(companyUuid, brandUuid),
    enabled: !!companyUuid && !!brandUuid,
  })
}
