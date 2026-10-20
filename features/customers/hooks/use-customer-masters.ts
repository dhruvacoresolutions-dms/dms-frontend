"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerMasters } from "../api/customer.api"
import { customerMasterKeys } from "../api/customer-keys"
import type {
  CustomerMasterKind,
  CustomerMasterListParams,
} from "../api/customer.types"

export function useCustomerMasters(
  companyUuid: string,
  kind: CustomerMasterKind,
  params?: CustomerMasterListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: customerMasterKeys.list(companyUuid, kind, params),
    queryFn: () => getCustomerMasters(companyUuid, kind, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
