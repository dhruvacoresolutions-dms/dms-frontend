"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateDistributorBranch } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { UpdateDistributorBranchRequest } from "../api/distributor.types"

export function useUpdateDistributorBranch(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      branchUuid,
      input,
    }: {
      branchUuid: string
      input: UpdateDistributorBranchRequest
    }) => updateDistributorBranch(companyUuid, distributorUuid, branchUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorKeys.branches(companyUuid, distributorUuid),
      })
    },
  })
}
