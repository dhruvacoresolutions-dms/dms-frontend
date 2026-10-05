"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateVehicleModelStatus } from "../api/vehicle-model.api"
import { vehicleModelKeys } from "../api/vehicle-model-keys"
import type { UpdateVehicleModelStatusRequest } from "../api/vehicle-model.types"

export function useUpdateVehicleModelStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      modelUuid,
      input,
    }: {
      modelUuid: string
      input: UpdateVehicleModelStatusRequest
    }) => updateVehicleModelStatus(companyUuid, modelUuid, input),
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
