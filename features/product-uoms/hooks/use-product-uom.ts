"use client"

import { useQuery } from "@tanstack/react-query"
import { getProductUom } from "../api/product-uom.api"
import { productUomKeys } from "../api/product-uom-keys"

export function useProductUom(companyUuid: string, uomUuid: string) {
  return useQuery({
    queryKey: productUomKeys.detail(companyUuid, uomUuid),
    queryFn: () => getProductUom(companyUuid, uomUuid),
    enabled: !!companyUuid && !!uomUuid,
  })
}
