"use client"

import { useQuery } from "@tanstack/react-query"
import { getDistributorReferences } from "../api/distributor-reference.api"
import { distributorReferenceKeys } from "../api/distributor-keys"
import type {
  DistributorReferenceKind,
  DistributorReferenceListParams,
} from "../api/distributor-reference.types"

export function useDistributorReferences(
  companyUuid: string,
  kind: DistributorReferenceKind,
  params?: DistributorReferenceListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: distributorReferenceKeys.list(companyUuid, kind, params),
    queryFn: () => getDistributorReferences(companyUuid, kind, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
