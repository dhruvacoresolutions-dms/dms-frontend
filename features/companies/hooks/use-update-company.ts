"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCompany } from "../api/company.api"
import { companyKeys } from "../api/company-keys"
import type { UpdateCompanyRequest } from "../api/company.types"

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      companyUuid,
      input,
    }: {
      companyUuid: string
      input: UpdateCompanyRequest
    }) => updateCompany(companyUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: companyKeys.detail(variables.companyUuid),
      })
    },
  })
}
