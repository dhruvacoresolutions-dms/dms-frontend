"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerBankEntries } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"

/** `GET …/customers/{uuid}/bank-entries` — active entries first, then newest. */
export function useCustomerBankEntries(
  companyUuid: string,
  customerUuid?: string | null
) {
  return useQuery({
    queryKey: customerKeys.bankEntries(companyUuid, customerUuid ?? ""),
    queryFn: () => getCustomerBankEntries(companyUuid, customerUuid as string),
    enabled: !!companyUuid && !!customerUuid,
  })
}
