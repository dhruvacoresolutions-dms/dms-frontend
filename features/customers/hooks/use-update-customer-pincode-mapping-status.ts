"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCustomerPincodeMappingStatus } from "../api/customer.api"
import { customerPincodeKeys } from "../api/customer-keys"
import type { CustomerPincodeRecordStatus } from "../api/customer.types"

export function useUpdateCustomerPincodeMappingStatus(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uuid,
      recordStatus,
      version,
    }: {
      uuid: string
      recordStatus: CustomerPincodeRecordStatus
      version: number
    }) => updateCustomerPincodeMappingStatus(companyUuid, uuid, { recordStatus, version }),
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
