"use client"

import { useMemo, useState } from "react"
import { Plus, MoreHorizontal, Pencil, ToggleLeft, ToggleRight, ReceiptText, Upload } from "lucide-react"
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
import type { GstHsnResponse } from "@/features/gst-hsn/api/gst-hsn.types"
import { useGstHsns } from "@/features/gst-hsn/hooks/use-gst-hsns"
import { useUpdateGstHsnStatus } from "@/features/gst-hsn/hooks/use-update-gst-hsn-status"
import { GstHsnFormDialog } from "@/features/gst-hsn/components/GstHsnFormDialog"
import { GstHsnBulkUploadDialog } from "@/features/gst-hsn/components/GstHsnBulkUploadDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function GstHsnPage() {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW}>
      <GstHsnContent />
    </RouteGate>
  )
}

function GstHsnContent() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<{ uuid: string; currentStatus: string; version?: number } | null>(null)

  const { data, isLoading, error, refetch } = useGstHsns(companyUuid, {
    search: search || undefined,
    page,
    size,
  })

  const updateStatusMutation = useUpdateGstHsnStatus(companyUuid)

  const hsns = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<GstHsnResponse>[]>(
    () => [
      {
        id: "hsnCode",
        header: "HSN Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.hsnCode}</span>
        ),
      },
      {
        id: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.description ?? "-"}</span>
        ),
      },
      {
        id: "gstProductType",
        header: "Product Type",
        cell: ({ row }) =>
          row.original.gstProductType ? <Badge variant="secondary">{row.original.gstProductType}</Badge> : "-",
      },
      {
        id: "effectiveFrom",
        header: "Effective From",
        cell: ({ row }) => row.original.effectiveFrom ?? "-",
      },
      {
        id: "effectiveTo",
        header: "Effective To",
        cell: ({ row }) => row.original.effectiveTo ?? "-",
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
          const h = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer"><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-auto min-w-40"
              >
                <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_UPDATE}>
                  <DropdownMenuItem onClick={() => setEditingUuid(h.hsnUuid)}>
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <DropdownMenuSeparator />
                <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_STATUS}>
                  <DropdownMenuItem
                    variant={
                      h.status === "ACTIVE" ? "destructive" : "default"
                    }
                    onClick={() => setStatusToggle({ uuid: h.hsnUuid, currentStatus: h.status, version: h.version })}
                  >
                    {h.status === "ACTIVE" ? <><ToggleLeft className="mr-2 size-4" />{" "} Deactivate</> : <><ToggleRight className="mr-2 size-4" /> Activate</>}
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
        title="GST HSN"
        description="Manage GST HSN codes"
        action={
          <div className="flex items-center gap-2">
            <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_IMPORT}>
              <Button variant="outline" onClick={() => setBulkOpen(true)}>
                <Upload className="mr-2 size-4" />
                Bulk Upload
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_CREATE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create HSN
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search GST HSN..."
          defaultValue={search}
          onChange={(v) => { setSearch(v); setPage(0) }}
        />
      </div>

      <DataTable
        columns={columns}
        data={hsns}
        getRowId={(h) => h.hsnUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: ReceiptText,
          title: "No GST HSN found",
          description: search ? "Try a different search." : "Create an HSN entry to get started.",
        }}
        pagination={{ page, totalPages, onPageChange: setPage, pageSize: size, onPageSizeChange: (s) => { setSize(s); setPage(0) } }}
      />

      <GstHsnFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <GstHsnFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        hsnUuid={editingUuid}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the GST HSN status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            {
              hsnUuid: statusToggle.uuid,
              input: {
                status: statusToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                ...(typeof statusToggle.version === "number" ? { version: statusToggle.version } : {}),
              },
            },
            {
              onSuccess: () => { toast.success("Status updated"); setStatusToggle(null) },
              onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
            }
          )
        }}
      />

      <GstHsnBulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
    </div>
  )
}
