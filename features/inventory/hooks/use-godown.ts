"use client"

import { useQuery } from "@tanstack/react-query"
import { getGodown } from "../api/godown.api"
import { godownKeys } from "../api/inventory-keys"

export function useGodown(
  companyUuid: string,
  distributorUuid: string,
  godownUuid: string
) {
  return useQuery({
    queryKey: godownKeys.detail(companyUuid, distributorUuid, godownUuid),
    queryFn: () => getGodown(companyUuid, distributorUuid, godownUuid),
    enabled: !!companyUuid && !!distributorUuid && !!godownUuid,
  })
}
