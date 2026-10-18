"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { changeDistributorLoginStatus } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { ChangeDistributorLoginStatusRequest } from "../api/distributor.types"

export function useChangeDistributorLoginStatus(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ChangeDistributorLoginStatusRequest) =>
      changeDistributorLoginStatus(companyUuid, distributorUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorKeys.login(companyUuid, distributorUuid),
      })
    },
  })
}
