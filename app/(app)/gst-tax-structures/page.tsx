"use client"

import { useMemo, useState } from "react"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Percent,
  Upload,
} from "lucide-react"
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
import type { GstTaxStructureResponse } from "@/features/gst-tax-structures/api/gst-tax-structures.types"
import { useGstTaxStructures } from "@/features/gst-tax-structures/hooks/use-gst-tax-structures"
import { useUpdateGstTaxStructureStatus } from "@/features/gst-tax-structures/hooks/use-update-gst-tax-structure-status"
import { GstTaxStructureFormDialog } from "@/features/gst-tax-structures/components/GstTaxStructureFormDialog"
import { GstTaxStructureBulkUploadDialog } from "@/features/gst-tax-structures/components/GstTaxStructureBulkUploadDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function GstTaxStructuresPage() {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW}>
      <GstTaxStructuresContent />
    </RouteGate>
  )
}

function formatRate(v: number | null) {
  return typeof v === "number" ? `${v}%` : "-"
}

function GstTaxStructuresContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<{
    uuid: string
    currentStatus: string
    version?: number
  } | null>(null)

  const { data, isLoading, error, refetch } = useGstTaxStructures(companyUuid, {
    search: search || undefined,
    page,
    size,
  })

  const updateStatusMutation = useUpdateGstTaxStructureStatus(companyUuid)

  const taxStructures = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<GstTaxStructureResponse>[]>(
    () => [
      {
        id: "taxCode",
        header: "Tax Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.taxCode}</span>
        ),
      },
      {
        id: "cgstRate",
        header: "CGST",
        cell: ({ row }) => formatRate(row.original.cgstRate),
      },
      {
        id: "sgstRate",
        header: "SGST",
        cell: ({ row }) => formatRate(row.original.sgstRate),
      },
      {
        id: "igstRate",
        header: "IGST",
        cell: ({ row }) => formatRate(row.original.igstRate),
      },
      {
        id: "effectiveFrom",
        header: "Effective From",
        cell: ({ row }) => row.original.effectiveFrom ?? "-",
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
          const t = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-40">
                <PermissionGate
                  permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_UPDATE}
                >
                  <DropdownMenuItem
                    onClick={() => setEditingUuid(t.taxStructureUuid)}
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <DropdownMenuSeparator />
                <PermissionGate
                  permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_STATUS}
                >
                  <DropdownMenuItem
                    variant={t.status === "ACTIVE" ? "destructive" : "default"}
                    onClick={() =>
                      setStatusToggle({
                        uuid: t.taxStructureUuid,
                        currentStatus: t.status,
                        version: t.version,
                      })
                    }
                  >
                    {t.status === "ACTIVE" ? (
                      <>
                        <ToggleLeft className="mr-2 size-4" /> Deactivate
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
        title="GST Tax Structures"
        description="Manage GST tax structures"
        action={
          <div className="flex items-center gap-2">
            <PermissionGate
              permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_IMPORT}
            >
              <Button variant="outline" onClick={() => setBulkOpen(true)}>
                <Upload className="mr-2 size-4" />
                Bulk Upload
              </Button>
            </PermissionGate>
            <PermissionGate
              permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_CREATE}
            >
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Tax Structure
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search tax structures..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={taxStructures}
        getRowId={(t) => t.taxStructureUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: Percent,
          title: "No tax structures found",
          description: search
            ? "Try a different search."
            : "Create a tax structure to get started.",
        }}
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
          pageSize: size,
          onPageSizeChange: (s) => {
            setSize(s)
            setPage(0)
          },
        }}
      />

      <GstTaxStructureFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <GstTaxStructureFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        taxStructureUuid={editingUuid}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the tax structure status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            {
              taxStructureUuid: statusToggle.uuid,
              input: {
                status:
                  statusToggle.currentStatus === "ACTIVE"
                    ? "INACTIVE"
                    : "ACTIVE",
                ...(typeof statusToggle.version === "number"
                  ? { version: statusToggle.version }
                  : {}),
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

      <GstTaxStructureBulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
    </div>
  )
}
