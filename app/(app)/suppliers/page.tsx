"use client"

import { useMemo, useState } from "react"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Truck,
  Upload,
  History,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/common/SearchInput"
import { StatusFilterSelect } from "@/components/common/StatusFilterSelect"
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
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { ExportDropdown } from "@/components/common/ExportDropdown"
import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers"
import { useUpdateSupplierStatus } from "@/features/suppliers/hooks/use-update-supplier-status"
import type { SupplierResponse } from "@/features/suppliers/api/supplier.types"
import { SupplierFormDialog } from "@/features/suppliers/components/SupplierFormDialog"
import { SupplierImportDialog } from "@/features/suppliers/components/SupplierImportDialog"
import { SupplierImportHistoryDialog } from "@/features/suppliers/components/SupplierImportHistoryDialog"
import { exportSuppliers } from "@/features/suppliers/api/supplier.api"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function SuppliersPage() {
  return (
    <RouteGate permission={PERMISSIONS.SUPPLIER.VIEW}>
      <SuppliersContent />
    </RouteGate>
  )
}

function SuppliersContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<{
    uuid: string
    currentStatus: string
    version?: number
  } | null>(null)

  const { data, isLoading, error, refetch } = useSuppliers(companyUuid, {
    search: search || undefined,
    status:
      statusFilter === "ALL"
        ? undefined
        : (statusFilter as "ACTIVE" | "INACTIVE"),
    page,
    size,
  })

  const updateStatusMutation = useUpdateSupplierStatus(companyUuid)

  const suppliers = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<SupplierResponse>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.supplierCode}</span>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.supplierName}</span>
        ),
      },
      {
        id: "contactPerson",
        header: "Contact Person",
        cell: ({ row }) => row.original.contactPerson ?? "—",
      },
      {
        id: "phone",
        header: "Phone",
        cell: ({ row }) => row.original.phone ?? "—",
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
          const s = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-40">
                <PermissionGate permission={PERMISSIONS.SUPPLIER.UPDATE}>
                  <DropdownMenuItem
                    onClick={() => setEditingUuid(s.supplierUuid)}
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <DropdownMenuSeparator />
                <PermissionGate permission={PERMISSIONS.SUPPLIER.STATUS}>
                  <DropdownMenuItem
                    variant={s.status === "ACTIVE" ? "destructive" : "default"}
                    onClick={() =>
                      setStatusToggle({
                        uuid: s.supplierUuid,
                        currentStatus: s.status,
                        version: s.version,
                      })
                    }
                  >
                    {s.status === "ACTIVE" ? (
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
        title="Suppliers"
        description="Manage supplier records"
        action={
          <div className="flex items-center gap-2">
            <PermissionGate permission={PERMISSIONS.SUPPLIER.IMPORT}>
              <Button variant="outline" onClick={() => setBulkOpen(true)}>
                <Upload className="mr-2 size-4" />
                Bulk Upload
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.SUPPLIER.CREATE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Supplier
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          placeholder="Search suppliers..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        <StatusFilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v)
            setPage(0)
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.SUPPLIER.IMPORT}>
            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
              <History className="mr-2 size-4" />
              Import History
            </Button>
          </PermissionGate>
          <ExportDropdown
            permission={PERMISSIONS.SUPPLIER.EXPORT}
            baseFileName="suppliers-export"
            onExport={(format) =>
              exportSuppliers(companyUuid, format, {
                search: search || undefined,
                status: statusFilter === "ALL" ? undefined : statusFilter,
              })
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        getRowId={(s) => s.supplierUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: Truck,
          title: "No suppliers found",
          description:
            search || statusFilter !== "ALL"
              ? "Try a different search or clear filters."
              : "Create a supplier to get started.",
          action:
            !search && statusFilter === "ALL" ? (
              <PermissionGate permission={PERMISSIONS.SUPPLIER.CREATE}>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 size-4" /> Create Supplier
                </Button>
              </PermissionGate>
            ) : undefined,
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

      <SupplierFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <SupplierFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        supplierUuid={editingUuid}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the supplier status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            {
              supplierUuid: statusToggle.uuid,
              input: {
                status:
                  statusToggle.currentStatus === "ACTIVE"
                    ? "INACTIVE"
                    : "ACTIVE",
                version: statusToggle.version,
              },
            },
            {
              onSuccess: () => {
                toast.success("Status updated")
                setStatusToggle(null)
              },
              onError: (err) => {
                toast.error(getApiErrorMessage(err, "Failed"))
              },
            }
          )
        }}
      />

      <SupplierImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
      <SupplierImportHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        companyUuid={companyUuid}
      />
    </div>
  )
}
