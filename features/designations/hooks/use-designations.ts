"use client"

import { useQuery } from "@tanstack/react-query"
import { getDesignations } from "../api/designation.api"
import { designationKeys } from "../api/designation-keys"
import type { DesignationListParams } from "../api/designation.types"

export function useDesignations(
  companyUuid: string,
  params?: DesignationListParams
) {
  return useQuery({
    queryKey: designationKeys.list(companyUuid, params),
    queryFn: () => getDesignations(companyUuid, params),
    enabled: !!companyUuid,
  })
}
