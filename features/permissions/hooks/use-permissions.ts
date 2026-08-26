"use client"

import { useQuery } from "@tanstack/react-query"
import { getPermissions } from "../api/permission.api"
import { permissionKeys } from "../api/permission-keys"
import type { PermissionListParams } from "../api/permission.types"

export function usePermissions(params?: PermissionListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: permissionKeys.list(params),
    queryFn: () => getPermissions(params),
    enabled: options?.enabled ?? true,
  })
}
