"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateVehicleMake } from "../api/vehicle-make.api"
import { vehicleMakeKeys } from "../api/vehicle-make-keys"
import type { UpdateVehicleMakeRequest } from "../api/vehicle-make.types"

export function useUpdateVehicleMake(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      makeUuid,
      input,
    }: {
      makeUuid: string
      input: UpdateVehicleMakeRequest
    }) => updateVehicleMake(companyUuid, makeUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: vehicleMakeKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: vehicleMakeKeys.detail(companyUuid, variables.makeUuid),
      })
    },
  })
}
