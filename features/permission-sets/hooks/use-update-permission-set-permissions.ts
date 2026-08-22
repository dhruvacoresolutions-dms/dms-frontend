"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updatePermissionSetPermissions } from "../api/permission-set.api"
import { permissionSetKeys } from "../api/permission-set-keys"
import type { PermissionCodesRequest } from "../api/permission-set.types"

export function useUpdatePermissionSetPermissions(
  companyUuid: string,
  setUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PermissionCodesRequest) =>
      updatePermissionSetPermissions(companyUuid, setUuid, input),
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
