"use client"

import { useMemo, useState } from "react"
import { ShieldCheck, ShieldAlert } from "lucide-react"
import { SearchInput } from "@/components/common/SearchInput"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import type { PermissionResponse } from "@/features/permissions/api/permission.types"
import { formatModuleLabel } from "@/features/permissions/utils/permission.utils"
import { getApiError } from "@/lib/api/api-error"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"

export default function PermissionsPage() {
  return (
    <RouteGate permission={PERMISSIONS.PERMISSION.VIEW}>
      <PermissionsContent />
    </RouteGate>
  )
}

function PermissionsContent() {
  const [search, setSearch] = useState("")
  const { data: permissions, isLoading, error, refetch } = usePermissions()
  const apiError = getApiError(error)
  const isForbidden = apiError?.code === "ACCESS_DENIED" || apiError?.code === "FORBIDDEN" || (error as unknown as { response?: { status: number } })?.response?.status === 403

  const filtered = permissions?.filter(
    (p) =>
      !search ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.resourceCode.toLowerCase().includes(search.toLowerCase()) ||
      (p.actionCode ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const columns = useMemo<DataTableColumn<PermissionResponse>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.code}</span>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => row.original.name,
      },
      {
        id: "resource",
        header: "Resource",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {formatModuleLabel(row.original.resourceCode)}
          </Badge>
        ),
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <span className="capitalize">{row.original.actionCode ?? "—"}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "ACTIVE" ? "default" : "outline"}
          >
            {row.original.status}
          </Badge>
        ),
      },
    ],
    []
  )

  if (!isLoading && isForbidden) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader title="Permissions" description="View all system permissions" />

        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Search permissions..."
            defaultValue={search}
            onChange={(v) => setSearch(v)}
          />
        </div>

        <EmptyState
          icon={ShieldAlert}
          title="Access denied"
          description="You need PERMISSION_VIEW permission to view permissions. Please login as Platform Administrator (superadmin) or contact your administrator."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Permissions" description="View all system permissions" />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search permissions..."
          defaultValue={search}
          onChange={(v) => setSearch(v)}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered ?? []}
        getRowId={(perm) => perm.code}
        isLoading={isLoading}
        error={error}
        errorMessage={apiError?.message ?? "Failed to load permissions"}
        onRetry={() => void refetch()}
        empty={{
          icon: ShieldCheck,
          title: "No permissions found",
          description: "No permissions match your search.",
        }}
      />
    </div>
  )
}
