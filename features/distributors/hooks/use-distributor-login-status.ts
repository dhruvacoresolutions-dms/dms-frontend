"use client"

import { useQuery } from "@tanstack/react-query"
import { getDistributorLoginStatus } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"

export function useDistributorLoginStatus(
  companyUuid: string,
  distributorUuid: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: distributorKeys.login(companyUuid, distributorUuid),
    queryFn: () => getDistributorLoginStatus(companyUuid, distributorUuid),
    enabled: !!companyUuid && !!distributorUuid && (options?.enabled ?? true),
  })
}
