"use client"

import { useQuery } from "@tanstack/react-query"
import { getPermissionMatrix } from "../api/permission.api"
import { permissionKeys } from "../api/permission-keys"

export function usePermissionMatrix(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: permissionKeys.matrix(),
    queryFn: getPermissionMatrix,
    enabled: options?.enabled ?? true,
  })
}
