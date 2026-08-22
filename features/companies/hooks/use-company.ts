"use client"

import { useQuery } from "@tanstack/react-query"
import { getCompany } from "../api/company.api"
import { companyKeys } from "../api/company-keys"

export function useCompany(companyUuid: string) {
  return useQuery({
    queryKey: companyKeys.detail(companyUuid),
    queryFn: () => getCompany(companyUuid),
    enabled: !!companyUuid,
  })
}
