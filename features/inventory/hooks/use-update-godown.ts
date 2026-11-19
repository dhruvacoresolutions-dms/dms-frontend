"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateGodown } from "../api/godown.api"
import { godownKeys } from "../api/inventory-keys"
import type { UpdateGodownRequest } from "../api/inventory.types"

export function useUpdateGodown(companyUuid: string, distributorUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      godownUuid,
      input,
    }: {
      godownUuid: string
      input: UpdateGodownRequest
    }) => updateGodown(companyUuid, distributorUuid, godownUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: godownKeys.lists(companyUuid, distributorUuid),
      })
      queryClient.invalidateQueries({
        queryKey: godownKeys.detail(
          companyUuid,
          distributorUuid,
          variables.godownUuid
        ),
      })
    },
  })
}
