"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, Pencil, ToggleLeft, ToggleRight, Award, Upload } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/common/SearchInput"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useProductBrands } from "@/features/product-brands/hooks/use-product-brands"
import { useUpdateProductBrandStatus } from "@/features/product-brands/hooks/use-update-product-brand-status"
import { ProductBrandFormDialog } from "@/features/product-brands/components/ProductBrandFormDialog"
import { ProductBrandImportDialog } from "@/features/product-brands/components/ProductBrandImportDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { ExportDropdown } from "@/components/common/ExportDropdown"
import { exportProductBrands } from "@/features/product-brands/api/product-brand.api"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function BrandsPage() {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW}>
      <BrandsContent />
    </RouteGate>
  )
}

function BrandsContent() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<{ uuid: string; currentStatus: string } | null>(null)

  const { data, isLoading, error, refetch } = useProductBrands(companyUuid, {
    search: search || undefined,
    page,
    size: 20,
  })

  const updateStatusMutation = useUpdateProductBrandStatus(companyUuid)

  const brands = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Product Brands"
        description="Manage product brands"
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
                <Plus className="mr-2 size-4" /> Create Brand
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search brands..."
          defaultValue={search}
          onChange={(v) => { setSearch(v); setPage(0) }}
        />
        <div className="ml-auto flex items-center gap-2">
          <ExportDropdown
            permission={PERMISSIONS.PRODUCT.EXPORT}
            baseFileName="product-brands-export"
            onExport={(format) =>
              exportProductBrands(companyUuid, format, {
                search: search || undefined,
              })
            }
          />
        </div>
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : error ? (
        <ErrorState onRetry={refetch} />
      ) : brands.length === 0 ? (
        <EmptyState icon={Award} title="No product brands found" description={search ? "Try a different search." : "Create a brand to get started."} />
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((b) => (
                  <TableRow key={b.brandUuid}>
                    <TableCell className="font-mono text-sm">{b.code}</TableCell>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.description ?? "-"}</TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer"><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-auto min-w-40"
                        >
                          <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_UPDATE}>
                            <DropdownMenuItem onClick={() => setEditingUuid(b.brandUuid)}>
                              <Pencil className="mr-2 size-4" /> Edit
                            </DropdownMenuItem>
                          </PermissionGate>
                          <DropdownMenuSeparator />
                          <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_STATUS}>
                            <DropdownMenuItem
                              variant={
                                b.status === "ACTIVE" ? "destructive" : "default"
                              }
                              onClick={() => setStatusToggle({ uuid: b.brandUuid, currentStatus: b.status })}
                            >
                              {b.status === "ACTIVE" ? <><ToggleLeft className="mr-2 size-4" />{" "} Deactivate</> : <><ToggleRight className="mr-2 size-4" /> Activate</>}
                            </DropdownMenuItem>
                          </PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      <ProductBrandFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <ProductBrandFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        brandUuid={editingUuid}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the brand status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            { brandUuid: statusToggle.uuid, input: { status: statusToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE" } },
            {
              onSuccess: () => { toast.success("Status updated"); setStatusToggle(null) },
              onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
            }
          )
        }}
      />

      <ProductBrandImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
    </div>
  )
}
