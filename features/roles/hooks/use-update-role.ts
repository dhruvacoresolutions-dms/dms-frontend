"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateRole } from "../api/role.api"
import { roleKeys } from "../api/role-keys"
import type { UpdateRoleRequest } from "../api/role.types"

export function useUpdateRole(companyUuid: string, roleUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateRoleRequest) =>
      updateRole(companyUuid, roleUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists(companyUuid) })
      queryClient.invalidateQueries({
        queryKey: roleKeys.detail(companyUuid, roleUuid),
      })
    },
  })
}
