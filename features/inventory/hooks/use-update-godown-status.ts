"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateGodownStatus } from "../api/godown.api"
import { godownKeys } from "../api/inventory-keys"

export function useUpdateGodownStatus(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      godownUuid,
      action,
      version,
    }: {
      godownUuid: string
      action: "activate" | "deactivate"
      version: number
    }) =>
      updateGodownStatus(companyUuid, distributorUuid, godownUuid, action, {
        version,
      }),
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
