"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { loadCustomerDefaults } from "../api/customer.api"
import { customerMasterKeys } from "../api/customer-keys"

/** Idempotently seeds the default classification rows for the company. */
export function useLoadCustomerDefaults(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => loadCustomerDefaults(companyUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: customerMasterKeys.all(companyUuid),
      })
    },
  })
}
