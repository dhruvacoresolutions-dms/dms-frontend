"use client"

import { useQuery } from "@tanstack/react-query"
import { getVehicleModels } from "../api/vehicle-model.api"
import { vehicleModelKeys } from "../api/vehicle-model-keys"
import type { VehicleModelListParams } from "../api/vehicle-model.types"

export function useVehicleModels(
  companyUuid: string,
  params?: VehicleModelListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: vehicleModelKeys.list(companyUuid, params),
    queryFn: () => getVehicleModels(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
