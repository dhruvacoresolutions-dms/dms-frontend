"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerCredit } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"

export function useCustomerCredit(
  companyUuid: string,
  customerUuid?: string | null
) {
  return useQuery({
    queryKey: customerKeys.credit(companyUuid, customerUuid ?? ""),
    queryFn: () => getCustomerCredit(companyUuid, customerUuid as string),
    enabled: !!companyUuid && !!customerUuid,
  })
}
