"use client"

import { useQuery } from "@tanstack/react-query"
import { getRole } from "../api/role.api"
import { roleKeys } from "../api/role-keys"

export function useRole(companyUuid: string, roleUuid: string) {
  return useQuery({
    queryKey: roleKeys.detail(companyUuid, roleUuid),
    queryFn: () => getRole(companyUuid, roleUuid),
    enabled: !!companyUuid && !!roleUuid,
  })
}
