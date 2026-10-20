"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerTypes } from "../api/customer.api"
import { customerMasterKeys } from "../api/customer-keys"

/** Global, immutable customer types (`RETAILER`, `MECHANIC`). */
export function useCustomerTypes(companyUuid: string) {
  return useQuery({
    queryKey: customerMasterKeys.types(companyUuid),
    queryFn: () => getCustomerTypes(companyUuid),
    enabled: !!companyUuid,
    staleTime: 5 * 60_000,
  })
}
