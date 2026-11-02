"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { bulkDisableDistributorLogins } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { BulkDistributorRequest } from "../api/distributor.types"

export function useBulkDisableDistributorLogins(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BulkDistributorRequest) =>
      bulkDisableDistributorLogins(companyUuid, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: distributorKeys.lists(companyUuid),
      }),
  })
}
