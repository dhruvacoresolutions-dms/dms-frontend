"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCompanyStatus } from "../api/company.api"
import { companyKeys } from "../api/company-keys"
import type { UpdateCompanyStatusRequest } from "../api/company.types"

export function useUpdateCompanyStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      companyUuid,
      input,
    }: {
      companyUuid: string
      input: UpdateCompanyStatusRequest
    }) => updateCompanyStatus(companyUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: companyKeys.detail(variables.companyUuid),
      })
    },
  })
}
