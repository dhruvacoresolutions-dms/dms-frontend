"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFuelType } from "../api/fuel-type.api"
import { fuelTypeKeys } from "../api/fuel-type-keys"
import type { CreateFuelTypeRequest } from "../api/fuel-type.types"

export function useCreateFuelType(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateFuelTypeRequest) =>
      createFuelType(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: fuelTypeKeys.lists(companyUuid),
      })
    },
  })
}
