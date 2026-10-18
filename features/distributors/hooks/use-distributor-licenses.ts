"use client"

import { useQuery } from "@tanstack/react-query"
import { getDistributorLicenses } from "../api/distributor.api"
import { distributorKeys } from "../api/distributor-keys"
import type { DistributorLicenseListParams } from "../api/distributor.types"

export function useDistributorLicenses(
  companyUuid: string,
  distributorUuid: string,
  params?: DistributorLicenseListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: distributorKeys.licenseList(companyUuid, distributorUuid, params),
    queryFn: () => getDistributorLicenses(companyUuid, distributorUuid, params),
    enabled: !!companyUuid && !!distributorUuid && (options?.enabled ?? true),
  })
}
