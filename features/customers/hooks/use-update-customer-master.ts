"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCustomerMaster } from "../api/customer.api"
import { customerMasterKeys } from "../api/customer-keys"
import type {
  CustomerMasterKind,
  CustomerMasterRequest,
} from "../api/customer.types"

export function useUpdateCustomerMaster(
  companyUuid: string,
  kind: CustomerMasterKind
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uuid,
      input,
    }: {
      uuid: string
      input: CustomerMasterRequest
    }) => updateCustomerMaster(companyUuid, kind, uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: customerMasterKeys.all(companyUuid),
      })
    },
  })
}
