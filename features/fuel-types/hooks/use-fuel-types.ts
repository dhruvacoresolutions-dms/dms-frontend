"use client"

import { useQuery } from "@tanstack/react-query"
import { getFuelTypes } from "../api/fuel-type.api"
import { fuelTypeKeys } from "../api/fuel-type-keys"
import type { FuelTypeListParams } from "../api/fuel-type.types"

export function useFuelTypes(
  companyUuid: string,
  params?: FuelTypeListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: fuelTypeKeys.list(companyUuid, params),
    queryFn: () => getFuelTypes(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
