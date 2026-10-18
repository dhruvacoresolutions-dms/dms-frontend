"use client"

import { useQuery } from "@tanstack/react-query"
import { listSupplierImportHistory } from "../api/supplier.api"
import { supplierKeys } from "../api/supplier-keys"
import type { SupplierImportHistoryParams } from "../api/supplier.types"

export function useSupplierImportHistory(
  companyUuid: string,
  params?: SupplierImportHistoryParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: supplierKeys.importList(companyUuid, params),
    queryFn: () => listSupplierImportHistory(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
