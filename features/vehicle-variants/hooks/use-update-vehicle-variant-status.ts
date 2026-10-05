"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateVehicleVariantStatus } from "../api/vehicle-variant.api"
import { vehicleVariantKeys } from "../api/vehicle-variant-keys"
import type { UpdateVehicleVariantStatusRequest } from "../api/vehicle-variant.types"

export function useUpdateVehicleVariantStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      variantUuid,
      input,
    }: {
      variantUuid: string
      input: UpdateVehicleVariantStatusRequest
    }) => updateVehicleVariantStatus(companyUuid, variantUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: vehicleVariantKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: vehicleVariantKeys.detail(companyUuid, variables.variantUuid),
      })
    },
  })
}
