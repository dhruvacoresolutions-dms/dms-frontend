"use client"

import { useQuery } from "@tanstack/react-query"
import { getGeographies } from "../api/geography.api"
import { geographyKeys } from "../api/geography-keys"
import type { GeographyListParams } from "../api/geography.types"

export function useGeographies(
  companyUuid: string,
  params?: GeographyListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: geographyKeys.list(companyUuid, params),
    queryFn: () => getGeographies(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
