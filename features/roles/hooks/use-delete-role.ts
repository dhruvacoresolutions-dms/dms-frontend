"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteRole } from "../api/role.api"
import { roleKeys } from "../api/role-keys"

export function useDeleteRole(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roleUuid: string) => deleteRole(companyUuid, roleUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists(companyUuid) })
    },
  })
}
