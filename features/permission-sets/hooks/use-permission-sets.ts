"use client"

import { useQuery } from "@tanstack/react-query"
import { getPermissionSets } from "../api/permission-set.api"
import { permissionSetKeys } from "../api/permission-set-keys"

export function usePermissionSets(companyUuid: string) {
  return useQuery({
    queryKey: permissionSetKeys.list(companyUuid),
    queryFn: () => getPermissionSets(companyUuid),
    enabled: !!companyUuid,
  })
}
