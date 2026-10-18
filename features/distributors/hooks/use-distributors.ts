"use client"

import { useQuery } from "@tanstack/react-query"
import { getDistributors } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { DistributorListParams } from "../api/distributor.types"

export function useDistributors(
  companyUuid: string,
  params?: DistributorListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: distributorKeys.list(companyUuid, params),
    queryFn: () => getDistributors(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
