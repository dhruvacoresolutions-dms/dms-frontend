"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateDistributorBranchStatus } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { UpdateDistributorBranchStatusRequest } from "../api/distributor.types"

export function useUpdateDistributorBranchStatus(
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
      input: UpdateDistributorBranchStatusRequest
    }) =>
      updateDistributorBranchStatus(
        companyUuid,
        distributorUuid,
        branchUuid,
        input
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorKeys.branches(companyUuid, distributorUuid),
      })
    },
  })
}
