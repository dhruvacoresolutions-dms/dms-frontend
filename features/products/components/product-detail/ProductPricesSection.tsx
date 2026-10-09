"use client"

import { useMemo, useState } from "react"
import { Ban, Pencil, Plus, Upload } from "lucide-react"
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
  useProductPrices,
  useDeactivateProductPrice,
} from "@/features/products/hooks/use-product-prices"
import { ProductPriceDialog } from "@/features/products/components/ProductPriceDialog"
import type { ProductPriceResponse } from "@/features/products/api/product.types"

export function ProductPricesSection({
  companyUuid,
  productUuid,
  onImport,
}: {
  companyUuid: string
  productUuid: string
  onImport: () => void
}) {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const { data, isLoading, error, refetch } = useProductPrices(
    companyUuid,
    productUuid,
    { page, size }
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [revisePrice, setRevisePrice] = useState<ProductPriceResponse | null>(
    null
  )
  const [deactivate, setDeactivate] = useState<ProductPriceResponse | null>(
    null
  )
  const deactivateMutation = useDeactivateProductPrice(companyUuid, productUuid)

  const prices = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  const columns = useMemo<DataTableColumn<ProductPriceResponse>[]>(
    () => [
      {
        id: "priceType",
        header: "Price Type",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.priceTypeName ?? row.original.priceTypeCode}
          </span>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.amount}</span>
        ),
      },
      {
        id: "effective",
        header: "Effective",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.effectiveFrom ?? "—"} →{" "}
            {row.original.effectiveTo ?? "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge status={row.original.priceStatus ?? "—"} />
        ),
      },
      {
        id: "reference",
        header: "Reference",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.externalReference ?? "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const pr = row.original
          return (
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <RowActionsMenu
                items={[
                  {
                    key: "revise",
                    label: "Revise",
                    icon: Pencil,
                    onClick: () => {
                      setRevisePrice(pr)
                      setDialogOpen(true)
                    },
                  },
                  {
                    key: "deactivate",
                    label: "Deactivate",
                    icon: Ban,
                    variant: "destructive",
                    onClick: () => setDeactivate(pr),
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
        <h3 className="text-sm font-medium">Product Prices</h3>
        <div className="ml-auto flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.PRODUCT.IMPORT}>
            <Button variant="outline" size="sm" onClick={onImport}>
              <Upload className="mr-2 size-4" />
              Import Prices
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
            <Button
              size="sm"
              onClick={() => {
                setRevisePrice(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-2 size-4" />
              Add Price
            </Button>
          </PermissionGate>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={prices}
        getRowId={(pr) => pr.priceUuid}
        isLoading={isLoading}
        skeletonRows={3}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          title: "No prices yet",
          description: "Add the first price for this product.",
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
      <ProductPriceDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setRevisePrice(null)
        }}
        companyUuid={companyUuid}
        productUuid={productUuid}
        price={revisePrice}
      />
      <ConfirmDialog
        open={!!deactivate}
        onOpenChange={(open) => !open && setDeactivate(null)}
        title="Deactivate Price?"
        description="This price will no longer apply."
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={deactivateMutation.isPending}
        onConfirm={() => {
          if (!deactivate) return
          deactivateMutation.mutate(
            {
              priceUuid: deactivate.priceUuid,
              input: { version: deactivate.version },
            },
            {
              onSuccess: () => {
                toast.success("Price deactivated")
                setDeactivate(null)
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
