"use client"

import { useMemo, useState } from "react"
import { Plus, MoreHorizontal, Pencil, ToggleLeft, ToggleRight, FolderTree, Upload } from "lucide-react"
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
import type { ProductCategoryResponse } from "@/features/product-categories/api/product-category.types"
import { useProductCategories } from "@/features/product-categories/hooks/use-product-categories"
import { useUpdateProductCategoryStatus } from "@/features/product-categories/hooks/use-update-product-category-status"
import { ProductCategoryFormDialog } from "@/features/product-categories/components/ProductCategoryFormDialog"
import { ProductCategoryImportDialog } from "@/features/product-categories/components/ProductCategoryImportDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { ExportDropdown } from "@/components/common/ExportDropdown"
import { exportProductCategories } from "@/features/product-categories/api/product-category.api"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function CategoriesPage() {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW}>
      <CategoriesContent />
    </RouteGate>
  )
}

function CategoriesContent() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<{ uuid: string; currentStatus: string } | null>(null)

  const { data, isLoading, error, refetch } = useProductCategories(companyUuid, {
    search: search || undefined,
    page,
    size,
  })

  const updateStatusMutation = useUpdateProductCategoryStatus(companyUuid)

  const categories = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<ProductCategoryResponse>[]>(
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
        id: "level",
        header: "Level",
        cell: ({ row }) =>
          row.original.categoryLevel !== undefined ? (
            <Badge variant="secondary">L{row.original.categoryLevel}</Badge>
          ) : (
            "-"
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
          const c = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer"><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-auto min-w-40"
              >
                <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_UPDATE}>
                  <DropdownMenuItem onClick={() => setEditingUuid(c.categoryUuid)}>
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <DropdownMenuSeparator />
                <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_STATUS}>
                  <DropdownMenuItem
                    variant={
                      c.status === "ACTIVE" ? "destructive" : "default"
                    }
                    onClick={() => setStatusToggle({ uuid: c.categoryUuid, currentStatus: c.status })}
                  >
                    {c.status === "ACTIVE" ? <><ToggleLeft className="mr-2 size-4" />{" "} Deactivate</> : <><ToggleRight className="mr-2 size-4" /> Activate</>}
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
        title="Product Categories"
        description="Manage product category hierarchy"
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
                <Plus className="mr-2 size-4" /> Create Category
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search categories..."
          defaultValue={search}
          onChange={(v) => { setSearch(v); setPage(0) }}
        />
        <div className="ml-auto flex items-center gap-2">
          <ExportDropdown
            permission={PERMISSIONS.PRODUCT.EXPORT}
            baseFileName="product-categories-export"
            onExport={(format) =>
              exportProductCategories(companyUuid, format, {
                search: search || undefined,
              })
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        getRowId={(c) => c.categoryUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: FolderTree,
          title: "No product categories found",
          description: search ? "Try a different search." : "Create a category to get started.",
        }}
        pagination={{ page, totalPages, onPageChange: setPage, pageSize: size, onPageSizeChange: (s) => { setSize(s); setPage(0) } }}
      />

      <ProductCategoryFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <ProductCategoryFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        categoryUuid={editingUuid}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the category status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            { categoryUuid: statusToggle.uuid, input: { status: statusToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE" } },
            {
              onSuccess: () => { toast.success("Status updated"); setStatusToggle(null) },
              onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
            }
          )
        }}
      />

      <ProductCategoryImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
    </div>
  )
}
