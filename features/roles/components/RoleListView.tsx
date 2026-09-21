"use client"

import { useState } from "react"
import { Shield } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { useRoles } from "../hooks/use-roles"
import type { RoleListItem } from "../api/role.types"
import { RoleTable } from "./RoleTable"
import { RoleCreateDialog } from "./RoleCreateDialog"
import { RoleDeleteDialog } from "./RoleDeleteDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"

type RoleListViewProps = {
  companyUuid: string
  /** Navigation base for row links — `/roles` or `/companies/<uuid>/roles`. */
  basePath: string
}

export function RoleListView({ companyUuid, basePath }: RoleListViewProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RoleListItem | null>(null)
  const { data: roles, isLoading, error, refetch } = useRoles(companyUuid)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Roles"
        description="Manage company roles"
        action={
          <PermissionGate permission={PERMISSIONS.ROLE.CREATE}>
            <RoleCreateDialog
              companyUuid={companyUuid}
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          </PermissionGate>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : !roles || roles.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No roles found"
          description="Create a role to get started."
        />
      ) : (
        <RoleTable
          roles={roles}
          basePath={basePath}
          onDelete={setDeleteTarget}
        />
      )}

      <RoleDeleteDialog
        companyUuid={companyUuid}
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
