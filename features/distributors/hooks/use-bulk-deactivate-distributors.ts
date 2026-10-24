"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { bulkDeactivateDistributors } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { BulkDistributorRequest } from "../api/distributor.types"
export function useBulkDeactivateDistributors(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BulkDistributorRequest) =>
      bulkDeactivateDistributors(companyUuid, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: distributorKeys.lists(companyUuid),
      }),
  })
}
