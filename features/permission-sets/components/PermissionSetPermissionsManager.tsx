"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TableSkeleton } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { EmptyState } from "@/components/common/EmptyState"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { PermissionMatrixPicker } from "@/features/permissions/components/PermissionMatrixPicker"
import { useUpdatePermissionSetPermissions } from "../hooks/use-update-permission-set-permissions"
import {
  getPermissionSetErrorMessage,
  getPermissionSetPermissions,
} from "../utils/permission-set.utils"
import type { PermissionSetDetail } from "../api/permission-set.types"

type PermissionSetPermissionsManagerProps = {
  companyUuid: string
  setUuid: string
  set: PermissionSetDetail | undefined
}

export function PermissionSetPermissionsManager({
  companyUuid,
  setUuid,
  set,
}: PermissionSetPermissionsManagerProps) {
  const updateMutation = useUpdatePermissionSetPermissions(companyUuid, setUuid)
  const {
    data: allPermissions,
    isLoading: listLoading,
    error: listError,
    refetch: refetchList,
  } = usePermissions()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [initializedKey, setInitializedKey] = useState<string | null>(null)

  // Sync local selection when the loaded set changes (render-phase
  // adjustment — avoids setState-in-effect cascading renders).
  const initialCodes = set ? getPermissionSetPermissions(set) : []
  const setKey = set
    ? `${set.permissionSetUuid}:${initialCodes.join(",")}`
    : null
  if (setKey !== initializedKey) {
    setInitializedKey(setKey)
    setSelected(new Set(initialCodes))
  }

  const initialSet = new Set(initialCodes)
  const hasChanges =
    initialSet.size !== selected.size ||
    Array.from(selected).some((code) => !initialSet.has(code))

  // BE rejects empty permissionCodes with VALIDATION_ERROR.
  const canSave = hasChanges && selected.size > 0 && !updateMutation.isPending

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const toggleAll = (codes: string[], select: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const code of codes) {
        if (select) next.add(code)
        else next.delete(code)
      }
      return next
    })
  }

  if (listLoading) return <TableSkeleton rows={6} />
  if (listError)
    return (
      <ErrorState message="Failed to load permissions" onRetry={refetchList} />
    )
  if (!allPermissions || allPermissions.length === 0)
    return (
      <EmptyState
        title="No permissions available"
        description="The permissions catalog is empty."
      />
    )

  // Assigned codes missing from the catalog (e.g. stale) — keep visible so
  // saving doesn't silently drop them.
  const catalogCodes = new Set(allPermissions.map((p) => p.code))
  const orphaned = Array.from(selected).filter((code) => !catalogCodes.has(code))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary">{selected.size} selected</Badge>
        {hasChanges && (
          <Badge variant="outline" className="text-amber-600">
            Unsaved changes
          </Badge>
        )}
        <div className="ml-auto">
          <Button
            disabled={!canSave}
            onClick={() => {
              updateMutation.mutate(
                { permissionCodes: Array.from(selected) },
                {
                  onSuccess: () => toast.success("Permissions updated"),
                  onError: (error) =>
                    toast.error(
                      getPermissionSetErrorMessage(
                        error,
                        "Failed to update permissions"
                      )
                    ),
                }
              )
            }}
          >
            {updateMutation.isPending ? "Saving..." : "Save Permissions"}
          </Button>
        </div>
      </div>

      {orphaned.length > 0 && (
        <Card>
          <CardContent className="space-y-2 pt-6">
            <p className="text-sm font-medium">
              Assigned but not in catalog ({orphaned.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {orphaned.map((code) => (
                <Badge
                  key={code}
                  variant="secondary"
                  className="gap-1 font-mono text-xs"
                >
                  {code}
                  <button
                    type="button"
                    onClick={() => toggle(code)}
                    className="ml-1 text-xs hover:text-destructive"
                    aria-label={`Remove ${code}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <PermissionMatrixPicker
        permissions={allPermissions}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        search={search}
        onSearchChange={setSearch}
      />
    </div>
  )
}
