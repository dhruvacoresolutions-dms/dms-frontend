"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { upsertDistributorBankAccount } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { UpsertDistributorBankRequest } from "../api/distributor.types"

export function useUpsertDistributorBankAccount(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertDistributorBankRequest) =>
      upsertDistributorBankAccount(companyUuid, distributorUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorKeys.bank(companyUuid, distributorUuid),
      })
    },
  })
}
