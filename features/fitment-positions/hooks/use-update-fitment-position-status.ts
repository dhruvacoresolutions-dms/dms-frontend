"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateFitmentPositionStatus } from "../api/fitment-position.api"
import { fitmentPositionKeys } from "../api/fitment-position-keys"
import type { UpdateFitmentPositionStatusRequest } from "../api/fitment-position.types"

export function useUpdateFitmentPositionStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      fitmentPositionUuid,
      input,
    }: {
      fitmentPositionUuid: string
      input: UpdateFitmentPositionStatusRequest
    }) => updateFitmentPositionStatus(companyUuid, fitmentPositionUuid, input),
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
