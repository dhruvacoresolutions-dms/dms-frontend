"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCustomer } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type { UpdateCustomerRequest } from "../api/customer.types"

export function useUpdateCustomer(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerUuid,
      input,
    }: {
      customerUuid: string
      input: UpdateCustomerRequest
    }) => updateCustomer(companyUuid, customerUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists(companyUuid) })
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(companyUuid, variables.customerUuid),
      })
    },
  })
}
