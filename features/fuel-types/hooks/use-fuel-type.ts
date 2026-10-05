"use client"

import { useQuery } from "@tanstack/react-query"
import { getFuelType } from "../api/fuel-type.api"
import { fuelTypeKeys } from "../api/fuel-type-keys"

export function useFuelType(companyUuid: string, fuelTypeUuid: string) {
  return useQuery({
    queryKey: fuelTypeKeys.detail(companyUuid, fuelTypeUuid),
    queryFn: () => getFuelType(companyUuid, fuelTypeUuid),
    enabled: !!companyUuid && !!fuelTypeUuid,
  })
}
