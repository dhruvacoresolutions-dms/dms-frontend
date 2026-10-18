"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { resetDistributorLoginPassword } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"

export function useResetDistributorLoginPassword(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => resetDistributorLoginPassword(companyUuid, distributorUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorKeys.login(companyUuid, distributorUuid),
      })
    },
  })
}
