"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createPermissionSet } from "../api/permission-set.api"
import { permissionSetKeys } from "../api/permission-set-keys"
import type { CreatePermissionSetRequest } from "../api/permission-set.types"

export function useCreatePermissionSet(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePermissionSetRequest) =>
      createPermissionSet(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: permissionSetKeys.lists(companyUuid),
      })
    },
  })
}
