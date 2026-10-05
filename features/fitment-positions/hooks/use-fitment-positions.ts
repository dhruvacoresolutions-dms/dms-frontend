"use client"

import { useQuery } from "@tanstack/react-query"
import { getFitmentPositions } from "../api/fitment-position.api"
import { fitmentPositionKeys } from "../api/fitment-position-keys"
import type { FitmentPositionListParams } from "../api/fitment-position.types"

export function useFitmentPositions(
  companyUuid: string,
  params?: FitmentPositionListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: fitmentPositionKeys.list(companyUuid, params),
    queryFn: () => getFitmentPositions(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
