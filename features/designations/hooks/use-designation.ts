"use client"

import { useQuery } from "@tanstack/react-query"
import { getDesignation } from "../api/designation.api"
import { designationKeys } from "../api/designation-keys"

export function useDesignation(companyUuid: string, designationUuid: string) {
  return useQuery({
    queryKey: designationKeys.detail(companyUuid, designationUuid),
    queryFn: () => getDesignation(companyUuid, designationUuid),
    enabled: !!companyUuid && !!designationUuid,
  })
}
