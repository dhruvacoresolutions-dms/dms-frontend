"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCustomer } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type { CustomerRequest } from "../api/customer.types"

export function useCreateCustomer(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CustomerRequest) => createCustomer(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists(companyUuid) })
    },
  })
}
