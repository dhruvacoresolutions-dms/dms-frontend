"use client"

import { use, useState } from "react"
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
import { LoadingState, TableSkeleton } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { EmptyState } from "@/components/common/EmptyState"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
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
  ProductPriceResponse,
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
                {(product.uomConversions ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No conversions defined.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>UOM</TableHead>
                        <TableHead>Factor</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Report</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(product.uomConversions ?? []).map((c, i) => (
                        <TableRow key={c.uuid ?? c.uomUuid ?? i}>
                          <TableCell>
                            {c.uom?.name ?? c.uom?.code ?? "—"}
                          </TableCell>
                          <TableCell>{c.conversionFactor}</TableCell>
                          <TableCell>{c.isDefault ? "Yes" : "—"}</TableCell>
                          <TableCell>{c.isReportUom ? "Yes" : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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

// ── Prices ───────────────────────────────────────────────────────────────────

function PricesSection({
  companyUuid,
  productUuid,
  onImport,
}: {
  companyUuid: string
  productUuid: string
  onImport: () => void
}) {
  const { data, isLoading, error, refetch } = useProductPrices(
    companyUuid,
    productUuid
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
      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : prices.length === 0 ? (
        <EmptyState
          title="No prices yet"
          description="Add the first price for this product."
        />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Price Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {prices.map((pr) => (
                <TableRow key={pr.priceUuid}>
                  <TableCell className="font-medium">
                    {pr.priceTypeName ?? pr.priceTypeCode}
                  </TableCell>
                  <TableCell className="font-mono">{pr.amount}</TableCell>
                  <TableCell className="text-sm">
                    {pr.effectiveFrom ?? "—"} → {pr.effectiveTo ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={pr.priceStatus ?? "—"} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {pr.externalReference ?? "—"}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
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
  const { data, isLoading, error, refetch } = useProductBatches(
    companyUuid,
    productUuid
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProductBatchResponse | null>(null)
  const [toggle, setToggle] = useState<ProductBatchResponse | null>(null)
  const statusMutation = useUpdateProductBatchStatus(companyUuid, productUuid)

  const batches = data?.content ?? []

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
      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : batches.length === 0 ? (
        <EmptyState
          title="No batches yet"
          description="Add the first batch for this product."
        />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Number</TableHead>
                <TableHead>Manufacturing</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => (
                <TableRow key={b.batchUuid}>
                  <TableCell className="font-mono">{b.batchNumber}</TableCell>
                  <TableCell>{b.manufacturingDate ?? "—"}</TableCell>
                  <TableCell>{b.expiryDate ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={b.status ?? "—"} />
                  </TableCell>
                  <TableCell>
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
                              b.status === "ACTIVE" ? "destructive" : "default"
                            }
                            onClick={() => setToggle(b)}
                          >
                            <Ban className="mr-2 size-4" />
                            {b.status === "ACTIVE"
                              ? "Deactivate"
                              : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
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
          statusMutation.mutate(
            {
              batchUuid: toggle.batchUuid,
              input: {
                batchStatus:
                  toggle.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
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
  const { data, isLoading, error, refetch } = useProductGstMappings(
    companyUuid,
    productUuid
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
        {isLoading ? (
          <TableSkeleton rows={2} />
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No GST mappings.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HSN</TableHead>
                <TableHead>Tax Code</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.gstMappingUuid}>
                  <TableCell className="font-mono text-sm">
                    {r.hsnCode ?? r.hsnUuid ?? "—"}
                  </TableCell>
                  <TableCell>{r.taxCode ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {r.effectiveFrom ?? "—"} → {r.effectiveTo ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status ?? "—"} />
                  </TableCell>
                  <TableCell>
                    <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setToggle({
                            uuid: r.gstMappingUuid,
                            version: r.version,
                            current: r.status ?? "ACTIVE",
                          })
                        }
                      >
                        Toggle
                      </Button>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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
  const { data, isLoading, error, refetch } = useProductRelationships(
    companyUuid,
    productUuid
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
        {isLoading ? (
          <TableSkeleton rows={2} />
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No relationships.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Related Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.relationshipUuid}>
                  <TableCell className="font-medium">
                    {r.relatedProductName ?? r.relatedProductCode ?? "—"}
                  </TableCell>
                  <TableCell>{r.relationshipTypeCode ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {r.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status ?? "—"} />
                  </TableCell>
                  <TableCell>
                    <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setToggle({
                            uuid: r.relationshipUuid,
                            version: r.version,
                            current: r.status ?? "ACTIVE",
                          })
                        }
                      >
                        Toggle
                      </Button>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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
  const { data, isLoading, error, refetch } = useProductFitments(
    companyUuid,
    productUuid
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
        {isLoading ? (
          <TableSkeleton rows={2} />
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fitments.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead>Fuel</TableHead>
                <TableHead>Engine</TableHead>
                <TableHead>Years</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.fitmentUuid}>
                  <TableCell className="font-medium">
                    {r.variantName ?? "—"}
                  </TableCell>
                  <TableCell>{r.fuelTypeName ?? "—"}</TableCell>
                  <TableCell>{r.engine ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {r.yearFrom ?? "—"} → {r.yearTo ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status ?? "—"} />
                  </TableCell>
                  <TableCell>
                    <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setToggle({
                            uuid: r.fitmentUuid,
                            version: r.version,
                            current: r.status ?? "ACTIVE",
                          })
                        }
                      >
                        Toggle
                      </Button>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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
  const { data, isLoading, error, refetch } = useProductGeographyMappings(
    companyUuid,
    productUuid
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
        {isLoading ? (
          <TableSkeleton rows={2} />
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No geography mappings.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Geography</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.geographyMappingUuid}>
                  <TableCell className="font-medium">
                    {r.geographyName ?? r.geographyCode ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status ?? "—"} />
                  </TableCell>
                  <TableCell>
                    <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setToggle({
                            uuid: r.geographyMappingUuid,
                            version: r.version,
                            current: r.status ?? "ACTIVE",
                          })
                        }
                      >
                        Toggle
                      </Button>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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

