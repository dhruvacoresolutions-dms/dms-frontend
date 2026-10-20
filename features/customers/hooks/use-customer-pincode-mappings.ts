"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerPincodeMappings } from "../api/customer.api"
import { customerPincodeKeys } from "../api/customer-keys"
import type { CustomerPincodeListParams } from "../api/customer.types"

export function useCustomerPincodeMappings(
  companyUuid: string,
  params?: CustomerPincodeListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: customerPincodeKeys.list(companyUuid, params),
    queryFn: () => getCustomerPincodeMappings(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
