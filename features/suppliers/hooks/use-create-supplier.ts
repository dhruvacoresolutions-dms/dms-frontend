"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createSupplier } from "../api/supplier.api"
import { supplierKeys } from "../api/supplier-keys"
import type { CreateSupplierRequest } from "../api/supplier.types"

export function useCreateSupplier(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSupplierRequest) =>
      createSupplier(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: supplierKeys.lists(companyUuid),
      })
    },
  })
}
