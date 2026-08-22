"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createGeography } from "../api/geography.api"
import { geographyKeys } from "../api/geography-keys"
import type { CreateGeographyRequest } from "../api/geography.types"

export function useCreateGeography(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateGeographyRequest) =>
      createGeography(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: geographyKeys.lists(companyUuid),
      })
    },
  })
}
