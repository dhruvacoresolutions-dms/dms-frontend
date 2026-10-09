"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"
import {
  Pencil,
  Plus,
  MoreHorizontal,
  Rocket,
  Ban,
  RotateCcw,
  Upload,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProduct } from "@/features/products/hooks/use-product"
import {
  usePublishProduct,
  useDeactivateProduct,
  useReactivateProduct,
} from "@/features/products/hooks/use-product-mutations"
import {
  useProductPrices,
  useDeactivateProductPrice,
} from "@/features/products/hooks/use-product-prices"
import {
  useProductBatches,
  useUpdateProductBatchStatus,
} from "@/features/products/hooks/use-product-batches"
import {
  useProductGstMappings,
  useUpdateProductGstMappingStatus,
  useProductRelationships,
  useUpdateProductRelationshipStatus,
  useProductFitments,
  useUpdateProductFitmentStatus,
  useProductGeographyMappings,
  useUpdateProductGeographyMappingStatus,
} from "@/features/products/hooks/use-product-mappings"
import { ProductPriceDialog } from "@/features/products/components/ProductPriceDialog"
import { ProductBatchDialog } from "@/features/products/components/ProductBatchDialog"
import {
  ProductGstMappingDialog,
  ProductRelationshipDialog,
  ProductFitmentDialog,
  ProductGeographyMappingDialog,
} from "@/features/products/components/ProductMappingDialogs"
import { ProductImportDialog } from "@/features/products/components/ProductImportDialog"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import type {
  ProductBatchResponse,
  ProductFitmentResponse,
  ProductGeographyMappingResponse,
  ProductGstMappingResponse,
  ProductPriceResponse,
  ProductRelationshipResponse,
  UomConversion,
} from "@/features/products/api/product.types"

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.VIEW}>
      <ProductDetailContent params={params} />
    </RouteGate>
  )
}

function ProductDetailContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  const { data: product, isLoading, error, refetch } = useProduct(
    companyUuid,
    id
  )
  const [lifecycle, setLifecycle] = useState<
    "publish" | "deactivate" | "reactivate" | null
  >(null)
  const [priceImportOpen, setPriceImportOpen] = useState(false)

  const publishMutation = usePublishProduct(companyUuid)
  const deactivateMutation = useDeactivateProduct(companyUuid)
  const reactivateMutation = useReactivateProduct(companyUuid)
  const lifecyclePending =
    publishMutation.isPending ||
    deactivateMutation.isPending ||
    reactivateMutation.isPending

  if (isLoading) return <LoadingState message="Loading product..." />
  if (error || !product) return <ErrorState onRetry={refetch} />

  const handleLifecycleConfirm = () => {
    if (!lifecycle) return
    const input = { version: product.version }
    const mutate =
      lifecycle === "publish"
        ? publishMutation
        : lifecycle === "deactivate"
          ? deactivateMutation
          : reactivateMutation
    mutate.mutate(
      { productUuid: id, input },
      {
        onSuccess: () => {
          toast.success(`Product ${lifecycle}d`)
          setLifecycle(null)
        },
        onError: (err) =>
          toast.error(getApiErrorMessage(err, "Action failed")),
      }
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={product.name}
        description={`${product.code} · v${product.version}`}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/products" />}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={`/products/${id}/edit`} />}
              >
                <Pencil className="mr-2 size-4" />
                Edit
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              {product.status === "DRAFT" && (
                <Button onClick={() => setLifecycle("publish")}>
                  <Rocket className="mr-2 size-4" />
                  Publish
                </Button>
              )}
              {product.status === "ACTIVE" && (
                <Button
                  variant="destructive"
                  onClick={() => setLifecycle("deactivate")}
                >
                  <Ban className="mr-2 size-4" />
                  Deactivate
                </Button>
              )}
              {product.status === "INACTIVE" && (
                <Button onClick={() => setLifecycle("reactivate")}>
                  <RotateCcw className="mr-2 size-4" />
                  Reactivate
                </Button>
              )}
            </PermissionGate>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prices">Prices</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="mappings">Mappings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow label="Code" value={product.code} mono />
                <InfoRow label="Name" value={product.name} />
                <InfoRow label="Short Name" value={product.shortName ?? "—"} />
                <InfoRow
                  label="Description"
                  value={product.description ?? "—"}
                />
                <InfoRow
                  label="Product Type"
                  value={product.productType ?? "—"}
                />
                <InfoRow
                  label="Category"
                  value={product.category?.name ?? "—"}
                />
                <InfoRow label="Barcode" value={product.barcode ?? "—"} mono />
                <InfoRow
                  label="Status"
                  value={<StatusBadge status={product.status} />}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Units, Weight & Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow
                  label="Base UOM"
                  value={product.baseUom?.name ?? "—"}
                />
                <InfoRow
                  label="Sales UOM"
                  value={product.salesUom?.name ?? "—"}
                />
                <InfoRow
                  label="Purchase UOM"
                  value={product.purchaseUom?.name ?? "—"}
                />
                <InfoRow
                  label="Net Weight"
                  value={
                    product.netWeight !== undefined
                      ? `${product.netWeight} ${product.weightUom ?? ""}`
                      : "—"
                  }
                />
                <InfoRow
                  label="Batch Tracking"
                  value={product.batchTrackingEnabled ? "Enabled" : "Disabled"}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Automotive Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow
                  label="Brand"
                  value={product.automotiveDetail?.brand?.name ?? "—"}
                />
                <InfoRow
                  label="Manufacturer"
                  value={product.automotiveDetail?.manufacturer ?? "—"}
                />
                <InfoRow
                  label="Part Number"
                  value={product.automotiveDetail?.partNumber ?? "—"}
                  mono
                />
                <InfoRow
                  label="OEM Part Number"
                  value={product.automotiveDetail?.oemPartNumber ?? "—"}
                  mono
                />
                <InfoRow
                  label="Pack Quantity"
                  value={product.automotiveDetail?.packQuantity?.toString() ?? "—"}
                />
                <InfoRow
                  label="Gross Weight"
                  value={product.automotiveDetail?.grossWeight?.toString() ?? "—"}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>UOM Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={uomConversionColumns}
                  data={product.uomConversions ?? []}
                  getRowId={(c, i) => c.uuid ?? c.uomUuid ?? String(i)}
                  emptyContent={
                    <p className="text-sm text-muted-foreground">
                      No conversions defined.
                    </p>
                  }
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prices">
          <PricesSection
            companyUuid={companyUuid}
            productUuid={id}
            onImport={() => setPriceImportOpen(true)}
          />
        </TabsContent>

        <TabsContent value="batches">
          <BatchesSection companyUuid={companyUuid} productUuid={id} />
        </TabsContent>

        <TabsContent value="mappings">
          <MappingsSection companyUuid={companyUuid} productUuid={id} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!lifecycle}
        onOpenChange={(open) => !open && setLifecycle(null)}
        title={
          lifecycle === "publish"
            ? "Publish Product?"
            : lifecycle === "deactivate"
              ? "Deactivate Product?"
              : "Reactivate Product?"
        }
        description="This will change the product lifecycle state."
        confirmLabel="Confirm"
        isLoading={lifecyclePending}
        onConfirm={handleLifecycleConfirm}
      />

      <ProductImportDialog
        open={priceImportOpen}
        onOpenChange={setPriceImportOpen}
        companyUuid={companyUuid}
        kind="prices"
      />
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono" : "text-right font-medium"}>
        {value}
      </span>
    </div>
  )
}

function shortUuid(uuid?: string | null) {
  if (!uuid) return undefined
  return uuid.length > 8 ? `${uuid.slice(0, 8)}…` : uuid
}

// ── Prices ───────────────────────────────────────────────────────────────────

const uomConversionColumns: DataTableColumn<UomConversion>[] = [
  {
    id: "uom",
    header: "UOM",
    cell: ({ row }) => row.original.uom?.name ?? row.original.uom?.code ?? "—",
  },
  {
    id: "factor",
    header: "Factor",
    cell: ({ row }) => row.original.conversionFactor,
  },
  {
    id: "default",
    header: "Default",
    cell: ({ row }) => (row.original.isDefault ? "Yes" : "—"),
  },
  {
    id: "report",
    header: "Report",
    cell: ({ row }) => (row.original.isReportUom ? "Yes" : "—"),
  },
]

function PricesSection({
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
            {row.original.effectiveFrom ?? "—"} → {row.original.effectiveTo ?? "—"}
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
          <span className="text-sm">{row.original.externalReference ?? "—"}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const pr = row.original
          return (
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <DropdownMenu>
                <DropdownMenuTrigger className="cursor-pointer">
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                  <DropdownMenuItem
                    onClick={() => {
                      setRevisePrice(pr)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 size-4" />
                    Revise
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeactivate(pr)}
                  >
                    <Ban className="mr-2 size-4" />
                    Deactivate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

// ── Batches ──────────────────────────────────────────────────────────────────

function BatchesSection({
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
          const status = b.status ?? b.batchStatus ?? "ACTIVE"
          return (
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <DropdownMenu>
                <DropdownMenuTrigger className="cursor-pointer">
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(b)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant={
                      status === "ACTIVE" ? "destructive" : "default"
                    }
                    onClick={() => setToggle(b)}
                  >
                    <Ban className="mr-2 size-4" />
                    {status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              size="sm"
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

// ── Mappings ─────────────────────────────────────────────────────────────────

function MappingsSection({
  companyUuid,
  productUuid,
}: {
  companyUuid: string
  productUuid: string
}) {
  const [gstOpen, setGstOpen] = useState(false)
  const [relOpen, setRelOpen] = useState(false)
  const [fitOpen, setFitOpen] = useState(false)
  const [geoOpen, setGeoOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <GstMappingsCard
        companyUuid={companyUuid}
        productUuid={productUuid}
        onAdd={() => setGstOpen(true)}
      />
      <RelationshipsCard
        companyUuid={companyUuid}
        productUuid={productUuid}
        onAdd={() => setRelOpen(true)}
      />
      <FitmentsCard
        companyUuid={companyUuid}
        productUuid={productUuid}
        onAdd={() => setFitOpen(true)}
      />
      <GeographyMappingsCard
        companyUuid={companyUuid}
        productUuid={productUuid}
        onAdd={() => setGeoOpen(true)}
      />
      <ProductGstMappingDialog
        open={gstOpen}
        onOpenChange={setGstOpen}
        companyUuid={companyUuid}
        productUuid={productUuid}
      />
      <ProductRelationshipDialog
        open={relOpen}
        onOpenChange={setRelOpen}
        companyUuid={companyUuid}
        productUuid={productUuid}
      />
      <ProductFitmentDialog
        open={fitOpen}
        onOpenChange={setFitOpen}
        companyUuid={companyUuid}
        productUuid={productUuid}
      />
      <ProductGeographyMappingDialog
        open={geoOpen}
        onOpenChange={setGeoOpen}
        companyUuid={companyUuid}
        productUuid={productUuid}
      />
    </div>
  )
}

function GstMappingsCard({
  companyUuid,
  productUuid,
  onAdd,
}: {
  companyUuid: string
  productUuid: string
  onAdd: () => void
}) {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const { data, isLoading, error, refetch } = useProductGstMappings(
    companyUuid,
    productUuid,
    { page, size }
  )
  const statusMutation = useUpdateProductGstMappingStatus(
    companyUuid,
    productUuid
  )
  const [toggle, setToggle] = useState<{
    uuid: string
    version: number
    current: string
  } | null>(null)
  const rows = data?.content ?? []
  const gstTotalPages = data?.totalPages ?? 0
  const gstTotalElements = data?.totalElements ?? 0

  const columns = useMemo<DataTableColumn<ProductGstMappingResponse>[]>(
    () => [
      {
        id: "hsn",
        header: "HSN",
        cell: ({ row }) => (
          <span className="font-mono text-sm" title={row.original.hsnUuid ?? undefined}>
            {row.original.hsnCode ?? shortUuid(row.original.hsnUuid) ?? "—"}
          </span>
        ),
      },
      {
        id: "taxStructure",
        header: "Tax Structure",
        cell: ({ row }) => (
          <span
            className="font-mono text-sm"
            title={row.original.taxStructureUuid ?? undefined}
          >
            {shortUuid(row.original.taxStructureUuid) ?? "—"}
            {row.original.taxStructureModel
              ? ` · ${row.original.taxStructureModel}`
              : ""}
          </span>
        ),
      },
      {
        id: "taxCode",
        header: "Tax Code",
        cell: ({ row }) => row.original.taxCode ?? "—",
      },
      {
        id: "effective",
        header: "Effective",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.effectiveFrom ?? "—"} → {row.original.effectiveTo ?? "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status ?? "—"} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original
          return (
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setToggle({
                    uuid: r.gstMappingUuid ?? r.mappingUuid ?? "",
                    version: r.version,
                    current: r.status ?? "ACTIVE",
                  })
                }
              >
                Toggle
              </Button>
            </PermissionGate>
          )
        },
      },
    ],
    []
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">GST Mappings</CardTitle>
        <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        </PermissionGate>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(r, i) => r.gstMappingUuid ?? r.mappingUuid ?? `gst-${i}`}
          isLoading={isLoading}
          skeletonRows={2}
          error={error}
          onRetry={() => void refetch()}
          emptyContent={
            <p className="text-sm text-muted-foreground">No GST mappings.</p>
          }
          pagination={{
            page,
            totalPages: gstTotalPages,
            onPageChange: setPage,
            totalElements: gstTotalElements,
            pageSize: size,
            onPageSizeChange: (s) => {
              setSize(s)
              setPage(0)
            },
          }}
        />
        <ConfirmDialog
          open={!!toggle}
          onOpenChange={(open) => !open && setToggle(null)}
          title="Change Status?"
          description="This will toggle the mapping ACTIVE/INACTIVE state."
          confirmLabel="Confirm"
          isLoading={statusMutation.isPending}
          onConfirm={() => {
            if (!toggle) return
            statusMutation.mutate(
              {
                gstMappingUuid: toggle.uuid,
                input: {
                  status:
                    toggle.current === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                  version: toggle.version,
                },
              },
              {
                onSuccess: () => {
                  toast.success("Status updated")
                  setToggle(null)
                },
                onError: (err) =>
                  toast.error(getApiErrorMessage(err, "Action failed")),
              }
            )
          }}
        />
      </CardContent>
    </Card>
  )
}

function RelationshipsCard({
  companyUuid,
  productUuid,
  onAdd,
}: {
  companyUuid: string
  productUuid: string
  onAdd: () => void
}) {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const { data, isLoading, error, refetch } = useProductRelationships(
    companyUuid,
    productUuid,
    { page, size }
  )
  const statusMutation = useUpdateProductRelationshipStatus(
    companyUuid,
    productUuid
  )
  const [toggle, setToggle] = useState<{
    uuid: string
    version: number
    current: string
  } | null>(null)
  const rows = data?.content ?? []
  const relTotalPages = data?.totalPages ?? 0
  const relTotalElements = data?.totalElements ?? 0

  const columns = useMemo<DataTableColumn<ProductRelationshipResponse>[]>(
    () => [
      {
        id: "relatedProduct",
        header: "Related Product",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.relatedProductName ?? row.original.relatedProductCode ?? "—"}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => row.original.relationshipTypeCode ?? "—",
      },
      {
        id: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.description ?? "—"}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status ?? "—"} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original
          return (
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setToggle({
                    uuid: r.relationshipUuid ?? (r as { mappingUuid?: string }).mappingUuid ?? "",
                    version: r.version,
                    current: r.status ?? "ACTIVE",
                  })
                }
              >
                Toggle
              </Button>
            </PermissionGate>
          )
        },
      },
    ],
    []
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Product Relationships</CardTitle>
        <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        </PermissionGate>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(r, i) => r.relationshipUuid ?? `rel-${i}`}
          isLoading={isLoading}
          skeletonRows={2}
          error={error}
          onRetry={() => void refetch()}
          emptyContent={
            <p className="text-sm text-muted-foreground">No relationships.</p>
          }
          pagination={{
            page,
            totalPages: relTotalPages,
            onPageChange: setPage,
            totalElements: relTotalElements,
            pageSize: size,
            onPageSizeChange: (s) => {
              setSize(s)
              setPage(0)
            },
          }}
        />
        <ConfirmDialog
          open={!!toggle}
          onOpenChange={(open) => !open && setToggle(null)}
          title="Change Status?"
          description="This will toggle the relationship ACTIVE/INACTIVE state."
          confirmLabel="Confirm"
          isLoading={statusMutation.isPending}
          onConfirm={() => {
            if (!toggle) return
            statusMutation.mutate(
              {
                relationshipUuid: toggle.uuid,
                input: {
                  status:
                    toggle.current === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                  version: toggle.version,
                },
              },
              {
                onSuccess: () => {
                  toast.success("Status updated")
                  setToggle(null)
                },
                onError: (err) =>
                  toast.error(getApiErrorMessage(err, "Action failed")),
              }
            )
          }}
        />
      </CardContent>
    </Card>
  )
}

function FitmentsCard({
  companyUuid,
  productUuid,
  onAdd,
}: {
  companyUuid: string
  productUuid: string
  onAdd: () => void
}) {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const { data, isLoading, error, refetch } = useProductFitments(
    companyUuid,
    productUuid,
    { page, size }
  )
  const statusMutation = useUpdateProductFitmentStatus(
    companyUuid,
    productUuid
  )
  const [toggle, setToggle] = useState<{
    uuid: string
    version: number
    current: string
  } | null>(null)
  const rows = data?.content ?? []
  const fitTotalPages = data?.totalPages ?? 0
  const fitTotalElements = data?.totalElements ?? 0

  const columns = useMemo<DataTableColumn<ProductFitmentResponse>[]>(
    () => [
      {
        id: "variant",
        header: "Variant",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.variantName ?? "—"}</span>
        ),
      },
      {
        id: "fuel",
        header: "Fuel",
        cell: ({ row }) => row.original.fuelTypeName ?? "—",
      },
      {
        id: "engine",
        header: "Engine",
        cell: ({ row }) => row.original.engine ?? "—",
      },
      {
        id: "years",
        header: "Years",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.yearFrom ?? "—"} → {row.original.yearTo ?? "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status ?? "—"} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original
          return (
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setToggle({
                    uuid: r.fitmentUuid ?? (r as { mappingUuid?: string }).mappingUuid ?? "",
                    version: r.version,
                    current: r.status ?? "ACTIVE",
                  })
                }
              >
                Toggle
              </Button>
            </PermissionGate>
          )
        },
      },
    ],
    []
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Vehicle Fitments</CardTitle>
        <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        </PermissionGate>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(r, i) => r.fitmentUuid ?? `fit-${i}`}
          isLoading={isLoading}
          skeletonRows={2}
          error={error}
          onRetry={() => void refetch()}
          emptyContent={
            <p className="text-sm text-muted-foreground">No fitments.</p>
          }
          pagination={{
            page,
            totalPages: fitTotalPages,
            onPageChange: setPage,
            totalElements: fitTotalElements,
            pageSize: size,
            onPageSizeChange: (s) => {
              setSize(s)
              setPage(0)
            },
          }}
        />
        <ConfirmDialog
          open={!!toggle}
          onOpenChange={(open) => !open && setToggle(null)}
          title="Change Status?"
          description="This will toggle the fitment ACTIVE/INACTIVE state."
          confirmLabel="Confirm"
          isLoading={statusMutation.isPending}
          onConfirm={() => {
            if (!toggle) return
            statusMutation.mutate(
              {
                fitmentUuid: toggle.uuid,
                input: {
                  status:
                    toggle.current === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                  version: toggle.version,
                },
              },
              {
                onSuccess: () => {
                  toast.success("Status updated")
                  setToggle(null)
                },
                onError: (err) =>
                  toast.error(getApiErrorMessage(err, "Action failed")),
              }
            )
          }}
        />
      </CardContent>
    </Card>
  )
}

function GeographyMappingsCard({
  companyUuid,
  productUuid,
  onAdd,
}: {
  companyUuid: string
  productUuid: string
  onAdd: () => void
}) {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const { data, isLoading, error, refetch } = useProductGeographyMappings(
    companyUuid,
    productUuid,
    { page, size }
  )
  const statusMutation = useUpdateProductGeographyMappingStatus(
    companyUuid,
    productUuid
  )
  const [toggle, setToggle] = useState<{
    uuid: string
    version: number
    current: string
  } | null>(null)
  const rows = data?.content ?? []
  const geoTotalPages = data?.totalPages ?? 0
  const geoTotalElements = data?.totalElements ?? 0

  const columns = useMemo<DataTableColumn<ProductGeographyMappingResponse>[]>(
    () => [
      {
        id: "geography",
        header: "Geography",
        cell: ({ row }) => (
          <span
            className="font-medium"
            title={row.original.geographyUuid ?? undefined}
          >
            {row.original.geographyName ??
              row.original.geographyCode ??
              shortUuid(row.original.geographyUuid) ??
              "—"}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => row.original.geographyType ?? "—",
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status ?? "—"} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original
          return (
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setToggle({
                    uuid: r.geographyMappingUuid ?? r.mappingUuid ?? "",
                    version: r.version,
                    current: r.status ?? "ACTIVE",
                  })
                }
              >
                Toggle
              </Button>
            </PermissionGate>
          )
        },
      },
    ],
    []
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Geography Availability</CardTitle>
        <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        </PermissionGate>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(r, i) =>
            r.geographyMappingUuid ?? r.mappingUuid ?? `geo-${i}`
          }
          isLoading={isLoading}
          skeletonRows={2}
          error={error}
          onRetry={() => void refetch()}
          emptyContent={
            <p className="text-sm text-muted-foreground">
              No geography mappings.
            </p>
          }
          pagination={{
            page,
            totalPages: geoTotalPages,
            onPageChange: setPage,
            totalElements: geoTotalElements,
            pageSize: size,
            onPageSizeChange: (s) => {
              setSize(s)
              setPage(0)
            },
          }}
        />
        <ConfirmDialog
          open={!!toggle}
          onOpenChange={(open) => !open && setToggle(null)}
          title="Change Status?"
          description="This will toggle the mapping ACTIVE/INACTIVE state."
          confirmLabel="Confirm"
          isLoading={statusMutation.isPending}
          onConfirm={() => {
            if (!toggle) return
            statusMutation.mutate(
              {
                geographyMappingUuid: toggle.uuid,
                input: {
                  status:
                    toggle.current === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                  version: toggle.version,
                },
              },
              {
                onSuccess: () => {
                  toast.success("Status updated")
                  setToggle(null)
                },
                onError: (err) =>
                  toast.error(getApiErrorMessage(err, "Action failed")),
              }
            )
          }}
        />
      </CardContent>
    </Card>
  )
}

