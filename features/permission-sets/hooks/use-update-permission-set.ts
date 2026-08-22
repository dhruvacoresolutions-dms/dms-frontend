"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updatePermissionSet } from "../api/permission-set.api"
import { permissionSetKeys } from "../api/permission-set-keys"
import type { UpdatePermissionSetRequest } from "../api/permission-set.types"

export function useUpdatePermissionSet(
  companyUuid: string,
  setUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdatePermissionSetRequest) =>
      updatePermissionSet(companyUuid, setUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: permissionSetKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: permissionSetKeys.detail(companyUuid, setUuid),
      })
    },
  })
}
