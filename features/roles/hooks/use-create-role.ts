"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createRole } from "../api/role.api"
import { roleKeys } from "../api/role-keys"
import type { CreateRoleRequest } from "../api/role.types"

export function useCreateRole(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRoleRequest) => createRole(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists(companyUuid) })
    },
  })
}
