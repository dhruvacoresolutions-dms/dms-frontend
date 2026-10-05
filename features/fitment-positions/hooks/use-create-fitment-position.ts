"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFitmentPosition } from "../api/fitment-position.api"
import { fitmentPositionKeys } from "../api/fitment-position-keys"
import type { CreateFitmentPositionRequest } from "../api/fitment-position.types"

export function useCreateFitmentPosition(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateFitmentPositionRequest) =>
      createFitmentPosition(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: fitmentPositionKeys.lists(companyUuid),
      })
    },
  })
}
