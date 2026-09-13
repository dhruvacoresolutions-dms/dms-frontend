"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { groupPermissionsByPrefix } from "../utils/role.utils"

type RolePermissionsCardProps = {
  permissionCodes: string[]
}

export function RolePermissionsCard({
  permissionCodes,
}: RolePermissionsCardProps) {
  const grouped = groupPermissionsByPrefix(permissionCodes)

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
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([prefix, codes]) => (
              <div key={prefix} className="space-y-2">
                <h4 className="text-sm font-medium capitalize">{prefix}</h4>
                <div className="flex flex-wrap gap-1">
                  {codes.map((code) => (
                    <Badge
                      key={code}
                      variant="secondary"
                      className="font-mono text-xs"
                    >
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
