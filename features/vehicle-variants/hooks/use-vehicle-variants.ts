"use client"

import { useQuery } from "@tanstack/react-query"
import { getVehicleVariants } from "../api/vehicle-variant.api"
import { vehicleVariantKeys } from "../api/vehicle-variant-keys"
import type { VehicleVariantListParams } from "../api/vehicle-variant.types"

export function useVehicleVariants(
  companyUuid: string,
  params?: VehicleVariantListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: vehicleVariantKeys.list(companyUuid, params),
    queryFn: () => getVehicleVariants(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
