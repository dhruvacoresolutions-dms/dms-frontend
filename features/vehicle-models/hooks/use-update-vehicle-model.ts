"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateVehicleModel } from "../api/vehicle-model.api"
import { vehicleModelKeys } from "../api/vehicle-model-keys"
import type { UpdateVehicleModelRequest } from "../api/vehicle-model.types"

export function useUpdateVehicleModel(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      modelUuid,
      input,
    }: {
      modelUuid: string
      input: UpdateVehicleModelRequest
    }) => updateVehicleModel(companyUuid, modelUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: vehicleModelKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: vehicleModelKeys.detail(companyUuid, variables.modelUuid),
      })
    },
  })
}
