"use client"

import { useQuery } from "@tanstack/react-query"
import { listCustomerPincodeImportHistory } from "../api/customer.api"
import { customerPincodeKeys } from "../api/customer-keys"

export function useCustomerPincodeImportHistory(
  companyUuid: string,
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: customerPincodeKeys.importList(companyUuid, params),
    queryFn: () => listCustomerPincodeImportHistory(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
