"use client"

import { useQuery } from "@tanstack/react-query"
import { getProduct } from "../api/product.api"
import { productKeys } from "../api/product-keys"

export function useProduct(companyUuid: string, productUuid: string) {
  return useQuery({
    queryKey: productKeys.detail(companyUuid, productUuid),
    queryFn: () => getProduct(companyUuid, productUuid),
    enabled: !!companyUuid && !!productUuid,
  })
}
