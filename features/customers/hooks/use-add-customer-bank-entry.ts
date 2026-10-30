"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addCustomerBankEntry } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type { CustomerBankInput } from "../api/customer.types"

/**
 * Adds a PENDING bank entry. The optional proof becomes the entry's
 * `proofFileUuid` (PNG/JPEG/PDF, max 5 MB, part name `proof`).
 */
export function useAddCustomerBankEntry(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerUuid,
      input,
      proof,
    }: {
      customerUuid: string
      input: CustomerBankInput
      proof?: File | null
    }) => addCustomerBankEntry(companyUuid, customerUuid, input, proof),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.bankEntries(companyUuid, variables.customerUuid),
      })
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(companyUuid, variables.customerUuid),
      })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists(companyUuid) })
    },
  })
}
