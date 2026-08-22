"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCompanyFeatures } from "../api/company.api"
import { companyKeys } from "../api/company-keys"
import type { FeatureEntitlementRequest } from "../api/company.types"

export function useUpdateCompanyFeatures(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: FeatureEntitlementRequest) =>
      updateCompanyFeatures(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyKeys.detail(companyUuid),
      })
    },
  })
}
