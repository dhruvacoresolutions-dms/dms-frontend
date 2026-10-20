"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomer } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"

export function useCustomer(companyUuid: string, customerUuid?: string | null) {
  return useQuery({
    queryKey: customerKeys.detail(companyUuid, customerUuid ?? ""),
    queryFn: () => getCustomer(companyUuid, customerUuid as string),
    enabled: !!companyUuid && !!customerUuid,
  })
}
