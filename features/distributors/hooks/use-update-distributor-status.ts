"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateDistributorStatus } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { UpdateDistributorStatusRequest } from "../api/distributor.types"

export function useUpdateDistributorStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      distributorUuid,
      input,
    }: {
      distributorUuid: string
      input: UpdateDistributorStatusRequest
    }) => updateDistributorStatus(companyUuid, distributorUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: distributorKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: distributorKeys.detail(companyUuid, variables.distributorUuid),
      })
    },
  })
}
