"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteCustomerKycDocument } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"

export function useDeleteCustomerKycDocument(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerUuid,
      documentUuid,
      version,
    }: {
      customerUuid: string
      documentUuid: string
      version?: number
    }) => deleteCustomerKycDocument(companyUuid, customerUuid, documentUuid, version),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.kyc(companyUuid, variables.customerUuid),
      })
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(companyUuid, variables.customerUuid),
      })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists(companyUuid) })
    },
  })
}
