"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { upsertCustomerCredit } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type { UpsertCustomerCreditRequest } from "../api/customer.types"

export function useUpsertCustomerCredit(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerUuid,
      input,
    }: {
      customerUuid: string
      input: UpsertCustomerCreditRequest
    }) => upsertCustomerCredit(companyUuid, customerUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.credit(companyUuid, variables.customerUuid),
      })
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(companyUuid, variables.customerUuid),
      })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists(companyUuid) })
    },
  })
}
