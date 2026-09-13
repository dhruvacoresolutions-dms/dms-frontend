"use client"

import { useState } from "react"
import { KeyRound } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { usePermissionSets } from "../hooks/use-permission-sets"
import type { PermissionSetListItem } from "../api/permission-set.types"
import { PermissionSetTable } from "./PermissionSetTable"
import { PermissionSetCreateDialog } from "./PermissionSetCreateDialog"
import { PermissionSetDeleteDialog } from "./PermissionSetDeleteDialog"

type PermissionSetListViewProps = {
  companyUuid: string
  /** Navigation base for row links — `/permission-sets` or `/companies/<uuid>/permission-sets`. */
  basePath: string
}

export function PermissionSetListView({
  companyUuid,
  basePath,
}: PermissionSetListViewProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] =
    useState<PermissionSetListItem | null>(null)
  const { data: sets, isLoading, error, refetch } = usePermissionSets(companyUuid)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Permission Sets"
        description="Manage permission sets"
        action={
          <PermissionSetCreateDialog
            companyUuid={companyUuid}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        }
      />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : !sets || sets.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No permission sets found"
          description="Create a permission set to get started."
        />
      ) : (
        <PermissionSetTable
          sets={sets}
          basePath={basePath}
          onDelete={setDeleteTarget}
        />
      )}

      <PermissionSetDeleteDialog
        companyUuid={companyUuid}
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
