"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createDistributor } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { CreateDistributorRequest } from "../api/distributor.types"

export function useCreateDistributor(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDistributorRequest) =>
      createDistributor(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorKeys.lists(companyUuid),
      })
    },
  })
}
