"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { applyCustomerLifecycleAction } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type {
  CustomerLifecycleAction,
  CustomerLifecycleRequest,
} from "../api/customer.types"

export function useCustomerLifecycleAction(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerUuid,
      action,
      input,
    }: {
      customerUuid: string
      action: CustomerLifecycleAction
      input: CustomerLifecycleRequest
    }) => applyCustomerLifecycleAction(companyUuid, customerUuid, action, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists(companyUuid) })
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(companyUuid, variables.customerUuid),
      })
      queryClient.invalidateQueries({
        queryKey: customerKeys.history(companyUuid, variables.customerUuid),
      })
    },
  })
}
