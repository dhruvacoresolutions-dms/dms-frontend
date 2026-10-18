"use client"

import { useQuery } from "@tanstack/react-query"
import { getDistributorImportJob } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"

export function useDistributorImportJob(
  companyUuid: string,
  jobUuid: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: distributorKeys.importDetail(companyUuid, jobUuid ?? ""),
    queryFn: () => getDistributorImportJob(companyUuid, jobUuid as string),
    enabled: !!companyUuid && !!jobUuid && enabled,
  })
}
