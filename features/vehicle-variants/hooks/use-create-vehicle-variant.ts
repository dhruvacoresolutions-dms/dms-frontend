"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createVehicleVariant } from "../api/vehicle-variant.api"
import { vehicleVariantKeys } from "../api/vehicle-variant-keys"
import type { CreateVehicleVariantRequest } from "../api/vehicle-variant.types"

export function useCreateVehicleVariant(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateVehicleVariantRequest) =>
      createVehicleVariant(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vehicleVariantKeys.lists(companyUuid),
      })
    },
  })
}
