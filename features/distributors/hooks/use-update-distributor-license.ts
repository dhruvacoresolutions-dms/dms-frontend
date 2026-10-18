"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateDistributorLicense } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { UpdateDistributorLicenseRequest } from "../api/distributor.types"

export function useUpdateDistributorLicense(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      licenseUuid,
      input,
    }: {
      licenseUuid: string
      input: UpdateDistributorLicenseRequest
    }) =>
      updateDistributorLicense(companyUuid, distributorUuid, licenseUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorKeys.licenses(companyUuid, distributorUuid),
      })
    },
  })
}
