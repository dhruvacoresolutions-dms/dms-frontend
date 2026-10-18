"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { setPrimaryDistributorBranch } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"

export function useSetPrimaryDistributorBranch(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      branchUuid,
      version,
    }: {
      branchUuid: string
      version?: number
    }) => setPrimaryDistributorBranch(companyUuid, distributorUuid, branchUuid, version),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorKeys.branches(companyUuid, distributorUuid),
      })
    },
  })
}
