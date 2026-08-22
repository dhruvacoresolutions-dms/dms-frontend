"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateGeographyStatus } from "../api/geography.api"
import { geographyKeys } from "../api/geography-keys"
import type { UpdateGeographyStatusRequest } from "../api/geography.types"

export function useUpdateGeographyStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      geographyUuid,
      input,
    }: {
      geographyUuid: string
      input: UpdateGeographyStatusRequest
    }) => updateGeographyStatus(companyUuid, geographyUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: geographyKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: geographyKeys.detail(companyUuid, variables.geographyUuid),
      })
    },
  })
}
