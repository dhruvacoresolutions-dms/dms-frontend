"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCustomerMaster } from "../api/customer.api"
import { customerMasterKeys } from "../api/customer-keys"
import type {
  CustomerMasterKind,
  CustomerMasterRequest,
} from "../api/customer.types"

export function useCreateCustomerMaster(
  companyUuid: string,
  kind: CustomerMasterKind
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CustomerMasterRequest) =>
      createCustomerMaster(companyUuid, kind, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: customerMasterKeys.all(companyUuid),
      })
    },
  })
}
