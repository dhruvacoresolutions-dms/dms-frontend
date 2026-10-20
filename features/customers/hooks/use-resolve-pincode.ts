"use client"

import { useQuery } from "@tanstack/react-query"
import { resolveCustomerPincode } from "../api/customer.api"
import { customerPincodeKeys } from "../api/customer-keys"

export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/

/** Resolve a pincode to its mapped territory (used by the customer form). */
export function useResolvePincode(
  companyUuid: string,
  pincode?: string | null
) {
  const value = (pincode ?? "").trim()

  return useQuery({
    queryKey: customerPincodeKeys.resolve(companyUuid, value),
    queryFn: () => resolveCustomerPincode(companyUuid, value),
    enabled: !!companyUuid && PINCODE_PATTERN.test(value),
    staleTime: 60_000,
    retry: false,
  })
}
