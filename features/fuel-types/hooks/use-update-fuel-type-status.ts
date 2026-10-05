"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateFuelTypeStatus } from "../api/fuel-type.api"
import { fuelTypeKeys } from "../api/fuel-type-keys"
import type { UpdateFuelTypeStatusRequest } from "../api/fuel-type.types"

export function useUpdateFuelTypeStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      fuelTypeUuid,
      input,
    }: {
      fuelTypeUuid: string
      input: UpdateFuelTypeStatusRequest
    }) => updateFuelTypeStatus(companyUuid, fuelTypeUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: fuelTypeKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: fuelTypeKeys.detail(companyUuid, variables.fuelTypeUuid),
      })
    },
  })
}
