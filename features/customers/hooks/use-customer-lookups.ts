"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerLookups } from "../api/customer.api"
import { customerMasterKeys } from "../api/customer-keys"
import type { CustomerLookupType } from "../api/customer.types"

/**
 * Active values of one lookup type, used by the customer form selects.
 *
 * `enabled` lets callers prefetch a lookup before its combobox mounts (for
 * example the workshop types on the edit form), so a saved code renders
 * immediately instead of waiting for the section to open.
 */
export function useCustomerLookups(
  companyUuid: string,
  lookupType: CustomerLookupType,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: customerMasterKeys.list(companyUuid, "customer-lookups", {
      lookupType,
      activeOnly: true,
      size: 100,
    }),
    queryFn: () => getCustomerLookups(companyUuid, lookupType),
    enabled: !!companyUuid && (options?.enabled ?? true),
    staleTime: 2 * 60_000,
  })
}
