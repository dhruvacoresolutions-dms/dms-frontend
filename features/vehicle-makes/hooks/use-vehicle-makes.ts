"use client"

import { useQuery } from "@tanstack/react-query"
import { getVehicleMakes } from "../api/vehicle-make.api"
import { vehicleMakeKeys } from "../api/vehicle-make-keys"
import type { VehicleMakeListParams } from "../api/vehicle-make.types"

export function useVehicleMakes(
  companyUuid: string,
  params?: VehicleMakeListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: vehicleMakeKeys.list(companyUuid, params),
    queryFn: () => getVehicleMakes(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
