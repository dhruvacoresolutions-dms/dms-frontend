"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCustomerPincodeMapping } from "../api/customer.api"
import { customerPincodeKeys } from "../api/customer-keys"
import type { SaveCustomerPincodeMappingRequest } from "../api/customer.types"

export function useUpdateCustomerPincodeMapping(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uuid,
      input,
    }: {
      uuid: string
      input: SaveCustomerPincodeMappingRequest
    }) => updateCustomerPincodeMapping(companyUuid, uuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerPincodeKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: customerPincodeKeys.detail(companyUuid, variables.uuid),
      })
    },
  })
}
