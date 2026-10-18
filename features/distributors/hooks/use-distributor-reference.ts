"use client"

import { useQuery } from "@tanstack/react-query"
import { getDistributorReference } from "../api/distributor-reference.api"
import { distributorReferenceKeys } from "../api/distributor-keys"
import type { DistributorReferenceKind } from "../api/distributor-reference.types"

export function useDistributorReference(
  companyUuid: string,
  kind: DistributorReferenceKind,
  uuid: string
) {
  return useQuery({
    queryKey: distributorReferenceKeys.detail(companyUuid, kind, uuid),
    queryFn: () => getDistributorReference(companyUuid, kind, uuid),
    enabled: !!companyUuid && !!uuid,
  })
}
