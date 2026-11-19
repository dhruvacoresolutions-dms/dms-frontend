"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createGodown } from "../api/godown.api"
import { godownKeys } from "../api/inventory-keys"
import type { CreateGodownRequest } from "../api/inventory.types"

export function useCreateGodown(companyUuid: string, distributorUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateGodownRequest) =>
      createGodown(companyUuid, distributorUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: godownKeys.lists(companyUuid, distributorUuid),
      })
    },
  })
}
