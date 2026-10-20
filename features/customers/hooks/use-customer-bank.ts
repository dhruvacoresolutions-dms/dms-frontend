"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerBank } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"

export function useCustomerBank(
  companyUuid: string,
  customerUuid?: string | null
) {
  return useQuery({
    queryKey: customerKeys.bank(companyUuid, customerUuid ?? ""),
    queryFn: () => getCustomerBank(companyUuid, customerUuid as string),
    enabled: !!companyUuid && !!customerUuid,
  })
}
