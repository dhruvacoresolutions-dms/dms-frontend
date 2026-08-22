"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateRolePermissions } from "../api/role.api"
import { roleKeys } from "../api/role-keys"
import type { PermissionCodesRequest } from "../api/role.types"

export function useUpdateRolePermissions(
  companyUuid: string,
  roleUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PermissionCodesRequest) =>
      updateRolePermissions(companyUuid, roleUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists(companyUuid) })
      queryClient.invalidateQueries({
        queryKey: roleKeys.detail(companyUuid, roleUuid),
      })
    },
  })
}
