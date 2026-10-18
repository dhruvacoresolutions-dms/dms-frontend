"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createDistributorBranch } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { CreateDistributorBranchRequest } from "../api/distributor.types"

export function useCreateDistributorBranch(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDistributorBranchRequest) =>
      createDistributorBranch(companyUuid, distributorUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorKeys.branches(companyUuid, distributorUuid),
      })
    },
  })
}
