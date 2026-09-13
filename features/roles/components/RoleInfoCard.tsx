"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/common/StatusBadge"
import type { RoleDetail } from "../api/role.types"
import { getRoleId } from "../utils/role.utils"

type RoleInfoCardProps = {
  role: RoleDetail
}

export function RoleInfoCard({ role }: RoleInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">UUID</span>
          <span className="truncate font-mono">{getRoleId(role)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Code</span>
          <span className="font-mono">{role.code}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{role.name}</span>
        </div>
        {role.description ? (
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Description</span>
            <span className="max-w-[60%] text-right">{role.description}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Status</span>
          <StatusBadge status={role.status} />
        </div>
      </CardContent>
    </Card>
  )
}
