"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateDistributorLicenseStatus } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { UpdateDistributorLicenseStatusRequest } from "../api/distributor.types"

export function useUpdateDistributorLicenseStatus(
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
      input: UpdateDistributorLicenseStatusRequest
    }) =>
      updateDistributorLicenseStatus(
        companyUuid,
        distributorUuid,
        licenseUuid,
        input
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorKeys.licenses(companyUuid, distributorUuid),
      })
    },
  })
}
