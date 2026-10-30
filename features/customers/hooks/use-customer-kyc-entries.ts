"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerKycEntries } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"

/** `GET …/customers/{uuid}/kyc-entries` — newest first, numbers masked. */
export function useCustomerKycEntries(
  companyUuid: string,
  customerUuid?: string | null
) {
  return useQuery({
    queryKey: customerKeys.kyc(companyUuid, customerUuid ?? ""),
    queryFn: () => getCustomerKycEntries(companyUuid, customerUuid as string),
    enabled: !!companyUuid && !!customerUuid,
  })
}
