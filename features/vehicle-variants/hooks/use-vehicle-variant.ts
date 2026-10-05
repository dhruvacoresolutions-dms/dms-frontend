"use client"

import { useQuery } from "@tanstack/react-query"
import { getVehicleVariant } from "../api/vehicle-variant.api"
import { vehicleVariantKeys } from "../api/vehicle-variant-keys"

export function useVehicleVariant(companyUuid: string, variantUuid: string) {
  return useQuery({
    queryKey: vehicleVariantKeys.detail(companyUuid, variantUuid),
    queryFn: () => getVehicleVariant(companyUuid, variantUuid),
    enabled: !!companyUuid && !!variantUuid,
  })
}
