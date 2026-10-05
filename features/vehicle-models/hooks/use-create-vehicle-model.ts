"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createVehicleModel } from "../api/vehicle-model.api"
import { vehicleModelKeys } from "../api/vehicle-model-keys"
import type { CreateVehicleModelRequest } from "../api/vehicle-model.types"

export function useCreateVehicleModel(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateVehicleModelRequest) =>
      createVehicleModel(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vehicleModelKeys.lists(companyUuid),
      })
    },
  })
}
