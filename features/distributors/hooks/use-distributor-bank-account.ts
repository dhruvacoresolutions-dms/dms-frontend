"use client"

import { useQuery } from "@tanstack/react-query"
import { getDistributorBankAccount } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"

export function useDistributorBankAccount(
  companyUuid: string,
  distributorUuid: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: distributorKeys.bank(companyUuid, distributorUuid),
    queryFn: () => getDistributorBankAccount(companyUuid, distributorUuid),
    enabled: !!companyUuid && !!distributorUuid && (options?.enabled ?? true),
  })
}
