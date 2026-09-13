"use client"

import { useQuery } from "@tanstack/react-query"
import { getPermissionSets } from "../api/permission-set.api"
import { permissionSetKeys } from "../api/permission-set-keys"
import type { PermissionSetListParams } from "../api/permission-set.types"

export function usePermissionSets(
  companyUuid: string,
  params?: PermissionSetListParams
) {
  return useQuery({
    queryKey: permissionSetKeys.list(companyUuid, params),
    queryFn: () => getPermissionSets(companyUuid, params),
    enabled: !!companyUuid,
  })
}
