"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createVehicleMake } from "../api/vehicle-make.api"
import { vehicleMakeKeys } from "../api/vehicle-make-keys"
import type { CreateVehicleMakeRequest } from "../api/vehicle-make.types"

export function useCreateVehicleMake(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateVehicleMakeRequest) =>
      createVehicleMake(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vehicleMakeKeys.lists(companyUuid),
      })
    },
  })
}
