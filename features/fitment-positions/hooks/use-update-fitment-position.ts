"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateFitmentPosition } from "../api/fitment-position.api"
import { fitmentPositionKeys } from "../api/fitment-position-keys"
import type { UpdateFitmentPositionRequest } from "../api/fitment-position.types"

export function useUpdateFitmentPosition(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      fitmentPositionUuid,
      input,
    }: {
      fitmentPositionUuid: string
      input: UpdateFitmentPositionRequest
    }) => updateFitmentPosition(companyUuid, fitmentPositionUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: fitmentPositionKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: fitmentPositionKeys.detail(
          companyUuid,
          variables.fitmentPositionUuid
        ),
      })
    },
  })
}
