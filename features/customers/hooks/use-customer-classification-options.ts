"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerClassificationOptions } from "../api/customer.api"
import { customerMasterKeys } from "../api/customer-keys"

/**
 * Valid classification values for a customer type + current selection.
 * Empty lists mean "no restriction" (the backend falls back to all active
 * rows), so callers should merge with their master lists.
 */
export function useCustomerClassificationOptions(
  companyUuid: string,
  customerTypeUuid?: string | null
) {
  return useQuery({
    queryKey: customerMasterKeys.options(companyUuid, { customerTypeUuid }),
    queryFn: () =>
      getCustomerClassificationOptions(companyUuid, {
        customerTypeUuid: customerTypeUuid as string,
      }),
    enabled: !!companyUuid && !!customerTypeUuid,
    staleTime: 2 * 60_000,
  })
}
