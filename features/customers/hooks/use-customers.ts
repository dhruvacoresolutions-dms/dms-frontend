"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomers } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type { CustomerListParams } from "../api/customer.types"

export function useCustomers(
  companyUuid: string,
  params?: CustomerListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: customerKeys.list(companyUuid, params),
    queryFn: () => getCustomers(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
