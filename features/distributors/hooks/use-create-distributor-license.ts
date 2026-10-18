"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createDistributorLicense } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { CreateDistributorLicenseRequest } from "../api/distributor.types"

export function useCreateDistributorLicense(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDistributorLicenseRequest) =>
      createDistributorLicense(companyUuid, distributorUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorKeys.licenses(companyUuid, distributorUuid),
      })
    },
  })
}
