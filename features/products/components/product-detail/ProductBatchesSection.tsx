"use client"

import { useMemo, useState } from "react"
import { Ban, Pencil, Plus, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RowActionsMenu } from "@/components/common/RowActionsMenu"
import { PERMISSIONS } from "@/lib/permissions"
import { getApiErrorMessage } from "@/lib/api/api-error"
import {
  useProductBatches,
  useUpdateProductBatchStatus,
} from "@/features/products/hooks/use-product-batches"
import { ProductBatchDialog } from "@/features/products/components/ProductBatchDialog"
import type { ProductBatchResponse } from "@/features/products/api/product.types"

export function ProductBatchesSection({
  companyUuid,
  productUuid,
}: {
  companyUuid: string
  productUuid: string
}) {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const { data, isLoading, error, refetch } = useProductBatches(
    companyUuid,
    productUuid,
    { page, size }
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProductBatchResponse | null>(null)
  const [toggle, setToggle] = useState<ProductBatchResponse | null>(null)
  const statusMutation = useUpdateProductBatchStatus(companyUuid, productUuid)

  const batches = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  const columns = useMemo<DataTableColumn<ProductBatchResponse>[]>(
    () => [
      {
        id: "batchNumber",
        header: "Batch Number",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.batchNumber}</span>
        ),
      },
      {
        id: "manufacturing",
        header: "Manufacturing",
        cell: ({ row }) => row.original.manufacturingDate ?? "—",
      },
      {
        id: "expiry",
        header: "Expiry",
        cell: ({ row }) => row.original.expiryDate ?? "—",
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status ?? row.original.batchStatus ?? "—"}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const b = row.original
          const isActive = (b.status ?? b.batchStatus ?? "ACTIVE") === "ACTIVE"
          return (
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <RowActionsMenu
                items={[
                  {
                    key: "edit",
                    label: "Edit",
                    icon: Pencil,
                    onClick: () => {
                      setEditing(b)
                      setDialogOpen(true)
                    },
                  },
                  {
                    key: "status",
                    label: isActive ? "Deactivate" : "Activate",
                    icon: isActive ? Ban : RotateCcw,
                    variant: isActive ? "destructive" : "default",
                    onClick: () => setToggle(b),
                  },
                ]}
              />
            </PermissionGate>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">Product Batches</h3>
        <div className="ml-auto">
          <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-2 size-4" />
              Add Batch
            </Button>
          </PermissionGate>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={batches}
        getRowId={(b, i) => b.batchUuid ?? `batch-${i}`}
        isLoading={isLoading}
        skeletonRows={3}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          title: "No batches yet",
          description: "Add the first batch for this product.",
        }}
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
          totalElements,
          pageSize: size,
          onPageSizeChange: (s) => {
            setSize(s)
            setPage(0)
          },
        }}
      />
      <ProductBatchDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        companyUuid={companyUuid}
        productUuid={productUuid}
        batch={editing}
      />
      <ConfirmDialog
        open={!!toggle}
        onOpenChange={(open) => !open && setToggle(null)}
        title="Change Batch Status?"
        description="This will toggle the batch ACTIVE/INACTIVE state."
        confirmLabel="Confirm"
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!toggle) return
          const current = toggle.status ?? toggle.batchStatus ?? "ACTIVE"
          statusMutation.mutate(
            {
              batchUuid: toggle.batchUuid,
              input: {
                batchStatus: current === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                version: toggle.version,
              },
            },
            {
              onSuccess: () => {
                toast.success("Batch status updated")
                setToggle(null)
              },
              onError: (err) =>
                toast.error(getApiErrorMessage(err, "Action failed")),
            }
          )
        }}
      />
    </div>
  )
}
