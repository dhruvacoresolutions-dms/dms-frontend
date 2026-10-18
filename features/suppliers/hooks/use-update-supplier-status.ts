"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateSupplierStatus } from "../api/supplier.api"
import { supplierKeys } from "../api/supplier-keys"
import type { UpdateSupplierStatusRequest } from "../api/supplier.types"

export function useUpdateSupplierStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      supplierUuid,
      input,
    }: {
      supplierUuid: string
      input: UpdateSupplierStatusRequest
    }) => updateSupplierStatus(companyUuid, supplierUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: supplierKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: supplierKeys.detail(companyUuid, variables.supplierUuid),
      })
    },
  })
}
