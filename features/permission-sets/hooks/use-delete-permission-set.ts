"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deletePermissionSet } from "../api/permission-set.api"
import { permissionSetKeys } from "../api/permission-set-keys"

export function useDeletePermissionSet(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (setUuid: string) => deletePermissionSet(companyUuid, setUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: permissionSetKeys.lists(companyUuid),
      })
    },
  })
}
