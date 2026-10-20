"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCustomerKycDocument } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type { SaveCustomerKycRequest } from "../api/customer.types"

export function useCreateCustomerKycDocument(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerUuid,
      input,
    }: {
      customerUuid: string
      input: SaveCustomerKycRequest
    }) => createCustomerKycDocument(companyUuid, customerUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.kyc(companyUuid, variables.customerUuid),
      })
      // KYC writes bump the customer version (optimistic lock).
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(companyUuid, variables.customerUuid),
      })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists(companyUuid) })
    },
  })
}
