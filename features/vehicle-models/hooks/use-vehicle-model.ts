"use client"

import { useQuery } from "@tanstack/react-query"
import { getVehicleModel } from "../api/vehicle-model.api"
import { vehicleModelKeys } from "../api/vehicle-model-keys"

export function useVehicleModel(companyUuid: string, modelUuid: string) {
  return useQuery({
    queryKey: vehicleModelKeys.detail(companyUuid, modelUuid),
    queryFn: () => getVehicleModel(companyUuid, modelUuid),
    enabled: !!companyUuid && !!modelUuid,
  })
}
