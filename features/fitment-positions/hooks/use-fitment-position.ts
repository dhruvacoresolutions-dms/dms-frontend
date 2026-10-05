"use client"

import { useQuery } from "@tanstack/react-query"
import { getFitmentPosition } from "../api/fitment-position.api"
import { fitmentPositionKeys } from "../api/fitment-position-keys"

export function useFitmentPosition(
  companyUuid: string,
  fitmentPositionUuid: string
) {
  return useQuery({
    queryKey: fitmentPositionKeys.detail(companyUuid, fitmentPositionUuid),
    queryFn: () => getFitmentPosition(companyUuid, fitmentPositionUuid),
    enabled: !!companyUuid && !!fitmentPositionUuid,
  })
}
