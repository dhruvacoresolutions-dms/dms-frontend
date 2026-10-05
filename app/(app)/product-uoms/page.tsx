"use client"

import { useMemo, useState } from "react"
import { Plus, MoreHorizontal, Pencil, ToggleLeft, ToggleRight, Ruler, Upload } from "lucide-react"
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
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import type { ProductUomResponse } from "@/features/product-uoms/api/product-uom.types"
import { useProductUoms } from "@/features/product-uoms/hooks/use-product-uoms"
import { useUpdateProductUomStatus } from "@/features/product-uoms/hooks/use-update-product-uom-status"
import { ProductUomFormDialog } from "@/features/product-uoms/components/ProductUomFormDialog"
import { ProductUomImportDialog } from "@/features/product-uoms/components/ProductUomImportDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { ExportDropdown } from "@/components/common/ExportDropdown"
import { exportProductUoms } from "@/features/product-uoms/api/product-uom.api"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function UomsPage() {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW}>
      <UomsContent />
    </RouteGate>
  )
}

function UomsContent() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<{ uuid: string; currentStatus: string } | null>(null)

  const { data, isLoading, error, refetch } = useProductUoms(companyUuid, {
    search: search || undefined,
    page,
    size,
  })

  const updateStatusMutation = useUpdateProductUomStatus(companyUuid)

  const uoms = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<ProductUomResponse>[]>(
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
        cell: ({ row }) => row.original.description ?? "-",
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
          const u = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer"><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-auto min-w-40"
              >
                <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_UPDATE}>
                  <DropdownMenuItem onClick={() => setEditingUuid(u.uomUuid)}>
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <DropdownMenuSeparator />
                <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_STATUS}>
                  <DropdownMenuItem
                    variant={
                      u.status === "ACTIVE" ? "destructive" : "default"
                    }
                    onClick={() => setStatusToggle({ uuid: u.uomUuid, currentStatus: u.status })}
                  >
                    {u.status === "ACTIVE" ? <><ToggleLeft className="mr-2 size-4" />{" "} Deactivate</> : <><ToggleRight className="mr-2 size-4" /> Activate</>}
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
        title="Product UOMs"
        description="Manage product units of measure"
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
                <Plus className="mr-2 size-4" /> Create UOM
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search UOMs..."
          defaultValue={search}
          onChange={(v) => { setSearch(v); setPage(0) }}
        />
        <div className="ml-auto flex items-center gap-2">
          <ExportDropdown
            permission={PERMISSIONS.PRODUCT.EXPORT}
            baseFileName="product-uoms-export"
            onExport={(format) =>
              exportProductUoms(companyUuid, format, {
                search: search || undefined,
              })
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={uoms}
        getRowId={(u) => u.uomUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: Ruler,
          title: "No product UOMs found",
          description: search ? "Try a different search." : "Create a UOM to get started.",
        }}
        pagination={{ page, totalPages, onPageChange: setPage, pageSize: size, onPageSizeChange: (s) => { setSize(s); setPage(0) } }}
      />

      <ProductUomFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <ProductUomFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        uomUuid={editingUuid}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the UOM status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            { uomUuid: statusToggle.uuid, input: { status: statusToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE" } },
            {
              onSuccess: () => { toast.success("Status updated"); setStatusToggle(null) },
              onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
            }
          )
        }}
      />

      <ProductUomImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
    </div>
  )
}
