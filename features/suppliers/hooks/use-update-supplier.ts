"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateSupplier } from "../api/supplier.api"
import { supplierKeys } from "../api/supplier-keys"
import type { UpdateSupplierRequest } from "../api/supplier.types"

export function useUpdateSupplier(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      supplierUuid,
      input,
    }: {
      supplierUuid: string
      input: UpdateSupplierRequest
    }) => updateSupplier(companyUuid, supplierUuid, input),
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
