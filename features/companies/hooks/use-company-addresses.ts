"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getCompanyAddresses, addCompanyAddress } from "../api/company.api"
import { companyKeys } from "../api/company-keys"
import type {
  CreateAddressRequest,
  CompanyAddressListParams,
} from "../api/company.types"

export function useCompanyAddresses(
  companyUuid: string,
  params?: CompanyAddressListParams
) {
  return useQuery({
    queryKey: companyKeys.addresses(companyUuid, params),
    queryFn: () => getCompanyAddresses(companyUuid, params),
    enabled: !!companyUuid,
  })
}

export function useAddCompanyAddress(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAddressRequest) =>
      addCompanyAddress(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyKeys.addresses(companyUuid),
      })
    },
  })
}
