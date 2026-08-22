"use client"

import { useQuery } from "@tanstack/react-query"
import { getPermissionSet } from "../api/permission-set.api"
import { permissionSetKeys } from "../api/permission-set-keys"

export function usePermissionSet(companyUuid: string, setUuid: string) {
  return useQuery({
    queryKey: permissionSetKeys.detail(companyUuid, setUuid),
    queryFn: () => getPermissionSet(companyUuid, setUuid),
    enabled: !!companyUuid && !!setUuid,
  })
}
