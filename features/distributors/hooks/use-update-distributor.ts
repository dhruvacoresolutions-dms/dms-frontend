"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateDistributor } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { UpdateDistributorRequest } from "../api/distributor.types"

export function useUpdateDistributor(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      distributorUuid,
      input,
    }: {
      distributorUuid: string
      input: UpdateDistributorRequest
    }) => updateDistributor(companyUuid, distributorUuid, input),
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
