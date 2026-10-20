"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerLookups } from "../api/customer.api"
import { customerMasterKeys } from "../api/customer-keys"
import type { CustomerLookupType } from "../api/customer.types"

/** Active values of one lookup type, used by the customer form selects. */
export function useCustomerLookups(
  companyUuid: string,
  lookupType: CustomerLookupType
) {
  return useQuery({
    queryKey: customerMasterKeys.list(companyUuid, "customer-lookups", {
      lookupType,
      activeOnly: true,
      size: 100,
    }),
    queryFn: () => getCustomerLookups(companyUuid, lookupType),
    enabled: !!companyUuid,
    staleTime: 2 * 60_000,
  })
}
