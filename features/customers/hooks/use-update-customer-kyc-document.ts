"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCustomerKycDocument } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type { SaveCustomerKycRequest } from "../api/customer.types"

export function useUpdateCustomerKycDocument(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerUuid,
      documentUuid,
      input,
    }: {
      customerUuid: string
      documentUuid: string
      input: SaveCustomerKycRequest
    }) => updateCustomerKycDocument(companyUuid, customerUuid, documentUuid, input),
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
