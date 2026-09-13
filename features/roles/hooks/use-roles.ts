"use client"

import { useQuery } from "@tanstack/react-query"
import { getRoles } from "../api/role.api"
import { roleKeys } from "../api/role-keys"
import type { RoleListParams } from "../api/role.types"

export function useRoles(companyUuid: string, params?: RoleListParams) {
  return useQuery({
    queryKey: roleKeys.list(companyUuid, params),
    queryFn: () => getRoles(companyUuid, params),
    enabled: !!companyUuid,
  })
}
