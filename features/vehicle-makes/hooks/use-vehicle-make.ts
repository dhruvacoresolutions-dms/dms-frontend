"use client"

import { useQuery } from "@tanstack/react-query"
import { getVehicleMake } from "../api/vehicle-make.api"
import { vehicleMakeKeys } from "../api/vehicle-make-keys"

export function useVehicleMake(companyUuid: string, makeUuid: string) {
  return useQuery({
    queryKey: vehicleMakeKeys.detail(companyUuid, makeUuid),
    queryFn: () => getVehicleMake(companyUuid, makeUuid),
    enabled: !!companyUuid && !!makeUuid,
  })
}
