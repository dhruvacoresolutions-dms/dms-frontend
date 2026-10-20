"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerLookupTypes } from "../api/customer.api"
import { customerMasterKeys } from "../api/customer-keys"

export function useCustomerLookupTypes(companyUuid: string) {
  return useQuery({
    queryKey: customerMasterKeys.lookupTypes(companyUuid),
    queryFn: () => getCustomerLookupTypes(companyUuid),
    enabled: !!companyUuid,
    staleTime: 5 * 60_000,
  })
}
