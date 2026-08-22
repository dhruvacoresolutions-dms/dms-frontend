"use client"

import { useQuery } from "@tanstack/react-query"
import { getRoles } from "../api/role.api"
import { roleKeys } from "../api/role-keys"

export function useRoles(companyUuid: string) {
  return useQuery({
    queryKey: roleKeys.list(companyUuid),
    queryFn: () => getRoles(companyUuid),
    enabled: !!companyUuid,
  })
}
