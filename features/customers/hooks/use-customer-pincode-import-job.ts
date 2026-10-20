"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerPincodeImportJob } from "../api/customer.api"
import { customerPincodeKeys } from "../api/customer-keys"

export function useCustomerPincodeImportJob(
  companyUuid: string,
  jobUuid?: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: customerPincodeKeys.importDetail(companyUuid, jobUuid ?? ""),
    queryFn: () => getCustomerPincodeImportJob(companyUuid, jobUuid as string),
    enabled: !!companyUuid && !!jobUuid && (options?.enabled ?? true),
  })
}
