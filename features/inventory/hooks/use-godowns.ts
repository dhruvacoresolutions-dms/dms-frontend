"use client"

import { useQuery } from "@tanstack/react-query"
import { getGodowns } from "../api/godown.api"
import { godownKeys } from "../api/inventory-keys"
import type { GodownListParams } from "../api/inventory.types"

export function useGodowns(
  companyUuid: string,
  distributorUuid: string,
  params?: GodownListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: godownKeys.list(companyUuid, distributorUuid, params),
    queryFn: () => getGodowns(companyUuid, distributorUuid, params),
    enabled:
      !!companyUuid &&
      !!distributorUuid &&
      (options?.enabled ?? true),
  })
}
