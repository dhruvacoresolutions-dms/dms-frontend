"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateGeography } from "../api/geography.api"
import { geographyKeys } from "../api/geography-keys"
import type { UpdateGeographyRequest } from "../api/geography.types"

export function useUpdateGeography(
  companyUuid: string,
  geographyUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateGeographyRequest) =>
      updateGeography(companyUuid, geographyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: geographyKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: geographyKeys.detail(companyUuid, geographyUuid),
      })
    },
  })
}
