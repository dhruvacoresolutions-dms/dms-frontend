"use client"

import { useQuery } from "@tanstack/react-query"
import { getDistributorBranches } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { DistributorBranchListParams } from "../api/distributor.types"

export function useDistributorBranches(
  companyUuid: string,
  distributorUuid: string,
  params?: DistributorBranchListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: distributorKeys.branchList(companyUuid, distributorUuid, params),
    queryFn: () => getDistributorBranches(companyUuid, distributorUuid, params),
    enabled:
      !!companyUuid && !!distributorUuid && (options?.enabled ?? true),
  })
}
