"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { upsertCustomerBank } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type { UpsertCustomerBankRequest } from "../api/customer.types"

export function useUpsertCustomerBank(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerUuid,
      input,
    }: {
      customerUuid: string
      input: UpsertCustomerBankRequest
    }) => upsertCustomerBank(companyUuid, customerUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.bank(companyUuid, variables.customerUuid),
      })
      // Saving the bank bumps the customer version (optimistic lock).
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(companyUuid, variables.customerUuid),
      })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists(companyUuid) })
    },
  })
}
