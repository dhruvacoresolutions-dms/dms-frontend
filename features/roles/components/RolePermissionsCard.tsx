"use client"

import { useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { PermissionMatrixView } from "@/features/permissions/components/PermissionMatrixView"

type RolePermissionsCardProps = {
  permissionCodes: string[]
}

export function RolePermissionsCard({
  permissionCodes,
}: RolePermissionsCardProps) {
  const { data: catalog, isLoading } = usePermissions()

  const byCode = useMemo(
    () => new Map((catalog ?? []).map((p) => [p.code, p])),
    [catalog]
  )
  const assigned = permissionCodes
    .map((code) => byCode.get(code))
    .filter((p) => p !== undefined)
  const unknownCodes = permissionCodes.filter((code) => !byCode.has(code))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <p className="text-sm text-muted-foreground">
          {permissionCodes.length} permission(s) assigned
        </p>
      </CardHeader>
      <CardContent>
        {permissionCodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No permissions assigned to this role yet.
          </p>
        ) : isLoading || !catalog ? (
          <p className="text-sm text-muted-foreground">
            Loading permissions...
          </p>
        ) : (
          <PermissionMatrixView
            permissions={assigned}
            unknownCodes={unknownCodes}
          />
        )}
      </CardContent>
    </Card>
  )
}
