"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerKycDocuments } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"

export function useCustomerKycDocuments(
  companyUuid: string,
  customerUuid?: string | null
) {
  return useQuery({
    queryKey: customerKeys.kyc(companyUuid, customerUuid ?? ""),
    queryFn: () => getCustomerKycDocuments(companyUuid, customerUuid as string),
    enabled: !!companyUuid && !!customerUuid,
  })
}
