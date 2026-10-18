"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupplierImportJob } from "../api/supplier.api"
import { supplierKeys } from "../api/supplier-keys"

export function useSupplierImportJob(
  companyUuid: string,
  jobUuid: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: supplierKeys.importDetail(companyUuid, jobUuid ?? ""),
    queryFn: () => getSupplierImportJob(companyUuid, jobUuid as string),
    enabled: !!companyUuid && !!jobUuid && enabled,
  })
}
