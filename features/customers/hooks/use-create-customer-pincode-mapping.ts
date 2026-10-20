"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCustomerPincodeMapping } from "../api/customer.api"
import { customerPincodeKeys } from "../api/customer-keys"
import type { SaveCustomerPincodeMappingRequest } from "../api/customer.types"

export function useCreateCustomerPincodeMapping(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SaveCustomerPincodeMappingRequest) =>
      createCustomerPincodeMapping(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: customerPincodeKeys.lists(companyUuid),
      })
    },
  })
}
