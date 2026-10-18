"use client"

import { useQuery } from "@tanstack/react-query"
import { getDistributor } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"

export function useDistributor(companyUuid: string, distributorUuid: string) {
  return useQuery({
    queryKey: distributorKeys.detail(companyUuid, distributorUuid),
    queryFn: () => getDistributor(companyUuid, distributorUuid),
    enabled: !!companyUuid && !!distributorUuid,
  })
}
