"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/common/StatusBadge"
import type { PermissionSetDetail } from "../api/permission-set.types"

type PermissionSetInfoCardProps = {
  set: PermissionSetDetail
}

export function PermissionSetInfoCard({ set }: PermissionSetInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Set Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Code</span>
          <span className="font-mono">{set.code}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{set.name}</span>
        </div>
        {set.description ? (
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Description</span>
            <span className="max-w-[60%] text-right">{set.description}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Status</span>
          <StatusBadge status={set.status} />
        </div>
      </CardContent>
    </Card>
  )
}
