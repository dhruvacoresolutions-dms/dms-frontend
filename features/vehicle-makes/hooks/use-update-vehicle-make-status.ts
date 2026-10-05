"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateVehicleMakeStatus } from "../api/vehicle-make.api"
import { vehicleMakeKeys } from "../api/vehicle-make-keys"
import type { UpdateVehicleMakeStatusRequest } from "../api/vehicle-make.types"

export function useUpdateVehicleMakeStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      makeUuid,
      input,
    }: {
      makeUuid: string
      input: UpdateVehicleMakeStatusRequest
    }) => updateVehicleMakeStatus(companyUuid, makeUuid, input),
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
