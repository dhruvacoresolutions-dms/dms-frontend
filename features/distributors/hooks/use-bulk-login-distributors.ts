"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { bulkLoginDistributors } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { BulkDistributorRequest } from "../api/distributor.types"

export function useBulkLoginDistributors(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BulkDistributorRequest) =>
      bulkLoginDistributors(companyUuid, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: distributorKeys.lists(companyUuid),
      }),
  })
}
