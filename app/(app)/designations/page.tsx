"use client"

import { useMemo, useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { Plus, MoreHorizontal, Pencil, ToggleLeft, ToggleRight, Upload } from "lucide-react"
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
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import type { DesignationResponse } from "@/features/designations/api/designation.types"
import { useDesignations } from "@/features/designations/hooks/use-designations"
import { useUpdateDesignationStatus } from "@/features/designations/hooks/use-update-designation-status"
import { DesignationFormDialog } from "@/features/designations/components/DesignationFormDialog"
import { DesignationBulkUploadDialog } from "@/features/designations/components/DesignationBulkUploadDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { ExportDropdown } from "@/components/common/ExportDropdown"
import { exportDesignations } from "@/features/designations/api/designation.api"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function DesignationsPage() {
  return (
    <RouteGate permission={PERMISSIONS.DESIGNATION.VIEW}>
      <DesignationsContent />
    </RouteGate>
  )
}

function DesignationsContent() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<{
    uuid: string
    currentStatus: string
  } | null>(null)

  const { data, isLoading, error, refetch } = useDesignations(companyUuid, {
    query: search || undefined,
    page,
    size,
  })

  const updateStatusMutation = useUpdateDesignationStatus(companyUuid)

  const designations = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<DesignationResponse>[]>(
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
        id: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.description ?? "-"}</span>
        ),
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
          const d = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-auto min-w-40"
              >
                <PermissionGate permission={PERMISSIONS.DESIGNATION.UPDATE}>
                  <DropdownMenuItem
                    onClick={() =>
                      setEditingUuid(d.publicId ?? d.designationUuid)
                    }
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.DESIGNATION.UPDATE}>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant={
                      d.status === "ACTIVE" ? "destructive" : "default"
                    }
                    onClick={() =>
                      setStatusToggle({
                        uuid: d.publicId ?? d.designationUuid,
                        currentStatus: d.status,
                      })
                    }
                  >
                  {d.status === "ACTIVE" ? (
                    <>
                      <ToggleLeft className="mr-2 size-4" />{" "}
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight className="mr-2 size-4" /> Activate
                    </>
                  )}
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
        title="Designations"
        description="Manage job designations"
        action={
          <div className="flex items-center gap-2">
            <PermissionGate permission={PERMISSIONS.DESIGNATION.IMPORT}>
              <Button variant="outline" onClick={() => setBulkOpen(true)}>
                <Upload className="mr-2 size-4" />
                Bulk Upload
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.DESIGNATION.CREATE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Designation
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search designations..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <ExportDropdown
            permission={PERMISSIONS.DESIGNATION.EXPORT}
            baseFileName="designations-export"
            onExport={(format) =>
              exportDesignations(companyUuid, format, {
                search: search || undefined,
              })
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={designations}
        getRowId={(d) => d.publicId ?? d.designationUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          title: "No designations found",
          description: search ? "Try a different search." : "Create a designation to get started.",
        }}
        pagination={{ page, totalPages, onPageChange: setPage, pageSize: size, onPageSizeChange: (s) => { setSize(s); setPage(0) } }}
      />

      <DesignationFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <DesignationFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        designationUuid={editingUuid}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the designation status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            {
              designationUuid: statusToggle.uuid,
              input: {
                status: statusToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE",
              },
            },
            {
              onSuccess: () => {
                toast.success("Status updated")
                setStatusToggle(null)
              },
              onError: (error) => {
                toast.error(getApiErrorMessage(error, "Failed"))
              },
            }
          )
        }}
      />

      <DesignationBulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
    </div>
  )
}
