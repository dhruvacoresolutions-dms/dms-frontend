"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCustomerKycStatus } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type { SaveCustomerKycStatusRequest } from "../api/customer.types"

export function useUpdateCustomerKycStatus(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerUuid,
      documentUuid,
      input,
    }: {
      customerUuid: string
      documentUuid: string
      input: SaveCustomerKycStatusRequest
    }) => updateCustomerKycStatus(companyUuid, customerUuid, documentUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.kyc(companyUuid, variables.customerUuid),
      })
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(companyUuid, variables.customerUuid),
      })
    },
  })
}
