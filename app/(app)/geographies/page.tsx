"use client"

import { useMemo, useState } from "react"
import { Plus, MoreHorizontal, Pencil, ToggleLeft, ToggleRight, MapPin, Upload } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/common/SearchInput"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import type { GeographyResponse } from "@/features/geographies/api/geography.types"
import { useGeographies } from "@/features/geographies/hooks/use-geographies"
import { useUpdateGeographyStatus } from "@/features/geographies/hooks/use-update-geography-status"
import { GeographyFormDialog } from "@/features/geographies/components/GeographyFormDialog"
import { GeographyBulkUploadDialog } from "@/features/geographies/components/GeographyBulkUploadDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { ExportDropdown } from "@/components/common/ExportDropdown"
import { exportGeographies } from "@/features/geographies/api/geography.api"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function GeographiesPage() {
  return (
    <RouteGate permission={PERMISSIONS.GEOGRAPHY.VIEW}>
      <GeographiesContent />
    </RouteGate>
  )
}

function GeographiesContent() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<{ uuid: string; currentStatus: string } | null>(null)

  const { data, isLoading, error, refetch } = useGeographies(companyUuid, {
    search: search || undefined,
    page,
    size,
  })

  const updateStatusMutation = useUpdateGeographyStatus(companyUuid)

  const geographies = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<GeographyResponse>[]>(
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
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
      },
      {
        id: "parent",
        header: "Parent",
        cell: ({ row }) => row.original.parentName ?? "-",
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const g = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer"><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-auto min-w-40"
              >
                <PermissionGate permission={PERMISSIONS.GEOGRAPHY.UPDATE}>
                  <DropdownMenuItem onClick={() => setEditingUuid(g.geographyUuid)}>
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <DropdownMenuSeparator />
                <PermissionGate permission={PERMISSIONS.GEOGRAPHY.UPDATE}>
                  <DropdownMenuItem
                    variant={
                      g.status === "ACTIVE" ? "destructive" : "default"
                    }
                    onClick={() => setStatusToggle({ uuid: g.geographyUuid, currentStatus: g.status })}
                  >
                    {g.status === "ACTIVE" ? <><ToggleLeft className="mr-2 size-4" />{" "} Deactivate</> : <><ToggleRight className="mr-2 size-4" /> Activate</>}
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Geographies"
        description="Manage geographical hierarchy"
        action={
          <div className="flex items-center gap-2">
            <PermissionGate permission={PERMISSIONS.GEOGRAPHY.IMPORT}>
              <Button variant="outline" onClick={() => setBulkOpen(true)}>
                <Upload className="mr-2 size-4" />
                Bulk Upload
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.GEOGRAPHY.CREATE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Geography
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search geographies..."
          defaultValue={search}
          onChange={(v) => { setSearch(v); setPage(0) }}
        />
        <div className="ml-auto flex items-center gap-2">
          <ExportDropdown
            permission={PERMISSIONS.GEOGRAPHY.EXPORT}
            baseFileName="geographies-export"
            onExport={(format) =>
              exportGeographies(companyUuid, format, {
                search: search || undefined,
              })
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={geographies}
        getRowId={(g) => g.geographyUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: MapPin,
          title: "No geographies found",
          description: search ? "Try a different search." : "Create a geography to get started.",
        }}
        pagination={{ page, totalPages, onPageChange: setPage, pageSize: size, onPageSizeChange: (s) => { setSize(s); setPage(0) } }}
      />

      <GeographyFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <GeographyFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        geographyUuid={editingUuid}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the geography status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            { geographyUuid: statusToggle.uuid, input: { status: statusToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE" } },
            {
              onSuccess: () => { toast.success("Status updated"); setStatusToggle(null) },
              onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
            }
          )
        }}
      />

      <GeographyBulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
    </div>
  )
}
