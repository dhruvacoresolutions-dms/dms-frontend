"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCompany } from "../api/company.api"
import { companyKeys } from "../api/company-keys"
import type { CreateCompanyRequest } from "../api/company.types"

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCompanyRequest) => createCompany(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
    },
  })
}
