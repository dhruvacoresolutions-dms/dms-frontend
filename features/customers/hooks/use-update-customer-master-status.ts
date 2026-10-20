"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCustomerMasterStatus } from "../api/customer.api"
import { customerMasterKeys } from "../api/customer-keys"
import type {
  CustomerMasterKind,
  CustomerMasterStatus,
} from "../api/customer.types"

export function useUpdateCustomerMasterStatus(
  companyUuid: string,
  kind: CustomerMasterKind
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uuid,
      status,
      version,
    }: {
      uuid: string
      status: CustomerMasterStatus
      version: number
    }) => updateCustomerMasterStatus(companyUuid, kind, uuid, { status, version }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: customerMasterKeys.all(companyUuid),
      })
    },
  })
}
