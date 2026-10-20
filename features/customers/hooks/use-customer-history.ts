"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerHistory } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"

export function useCustomerHistory(
  companyUuid: string,
  customerUuid?: string | null
) {
  return useQuery({
    queryKey: customerKeys.history(companyUuid, customerUuid ?? ""),
    queryFn: () => getCustomerHistory(companyUuid, customerUuid as string),
    enabled: !!companyUuid && !!customerUuid,
  })
}
