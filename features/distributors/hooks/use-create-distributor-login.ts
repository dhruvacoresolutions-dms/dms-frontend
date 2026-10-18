"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createDistributorLogin } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"

export function useCreateDistributorLogin(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => createDistributorLogin(companyUuid, distributorUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorKeys.login(companyUuid, distributorUuid),
      })
    },
  })
}
