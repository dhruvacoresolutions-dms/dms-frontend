"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupplier } from "../api/supplier.api"
import { supplierKeys } from "../api/supplier-keys"

export function useSupplier(companyUuid: string, supplierUuid: string) {
  return useQuery({
    queryKey: supplierKeys.detail(companyUuid, supplierUuid),
    queryFn: () => getSupplier(companyUuid, supplierUuid),
    enabled: !!companyUuid && !!supplierUuid,
  })
}
