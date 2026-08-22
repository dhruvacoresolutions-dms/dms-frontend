"use client"

import { useQuery } from "@tanstack/react-query"
import { getCompanies } from "../api/company.api"
import { companyKeys } from "../api/company-keys"
import type { CompanyListParams } from "../api/company.types"

export function useCompanies(params?: CompanyListParams) {
  return useQuery({
    queryKey: companyKeys.list(params),
    queryFn: () => getCompanies(params),
  })
}
