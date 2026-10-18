"use client"

import { useQuery } from "@tanstack/react-query"
import { getSuppliers } from "../api/supplier.api"
import { supplierKeys } from "../api/supplier-keys"
import type { SupplierListParams } from "../api/supplier.types"

export function useSuppliers(
  companyUuid: string,
  params?: SupplierListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: supplierKeys.list(companyUuid, params),
    queryFn: () => getSuppliers(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
