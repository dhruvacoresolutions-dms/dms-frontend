"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addCustomerKycEntry } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type { CustomerKycInput } from "../api/customer.types"

/**
 * Adds a PENDING KYC entry. The optional file becomes the entry's proof
 * document (PNG/JPEG/PDF, max 5 MB, part name `document`).
 */
export function useAddCustomerKycEntry(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerUuid,
      input,
      document,
    }: {
      customerUuid: string
      input: CustomerKycInput
      document?: File | null
    }) => addCustomerKycEntry(companyUuid, customerUuid, input, document),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.kyc(companyUuid, variables.customerUuid),
      })
      // Entry writes bump the customer version and its KYC counters.
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(companyUuid, variables.customerUuid),
      })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists(companyUuid) })
    },
  })
}
