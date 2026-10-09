"use client"

import { useMemo, useState } from "react"
import { Ban, Plus, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RowActionsMenu } from "@/components/common/RowActionsMenu"
import { PERMISSIONS } from "@/lib/permissions"
import { getApiErrorMessage } from "@/lib/api/api-error"
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
import {
  ProductGstMappingDialog,
  ProductRelationshipDialog,
  ProductFitmentDialog,
  ProductGeographyMappingDialog,
} from "@/features/products/components/ProductMappingDialogs"
import type {
  ProductFitmentResponse,
  ProductGeographyMappingResponse,
  ProductGstMappingResponse,
  ProductRelationshipResponse,
} from "@/features/products/api/product.types"

function shortUuid(uuid?: string | null) {
  if (!uuid) return undefined
  return uuid.length > 8 ? `${uuid.slice(0, 8)}…` : uuid
}

export function ProductMappingsSection({
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
          <span
            className="font-mono text-sm"
            title={row.original.hsnUuid ?? undefined}
          >
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
            {row.original.effectiveFrom ?? "—"} →{" "}
            {row.original.effectiveTo ?? "—"}
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
          const isActive = (r.status ?? "ACTIVE") === "ACTIVE"
          return (
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <RowActionsMenu
                items={[
                  {
                    key: "status",
                    label: isActive ? "Deactivate" : "Activate",
                    icon: isActive ? Ban : RotateCcw,
                    variant: isActive ? "destructive" : "default",
                    onClick: () =>
                      setToggle({
                        uuid: r.gstMappingUuid ?? r.mappingUuid ?? "",
                        version: r.version,
                        current: r.status ?? "ACTIVE",
                      }),
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">GST Mappings</CardTitle>
        <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
          <Button variant="outline" onClick={onAdd}>
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
          wrapperClassName="border-0"
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
                  status: toggle.current === "ACTIVE" ? "INACTIVE" : "ACTIVE",
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
            {row.original.relatedProductName ??
              row.original.relatedProductCode ??
              "—"}
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
          const isActive = (r.status ?? "ACTIVE") === "ACTIVE"
          return (
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <RowActionsMenu
                items={[
                  {
                    key: "status",
                    label: isActive ? "Deactivate" : "Activate",
                    icon: isActive ? Ban : RotateCcw,
                    variant: isActive ? "destructive" : "default",
                    onClick: () =>
                      setToggle({
                        uuid:
                          r.relationshipUuid ??
                          (r as { mappingUuid?: string }).mappingUuid ??
                          "",
                        version: r.version,
                        current: r.status ?? "ACTIVE",
                      }),
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Product Relationships</CardTitle>
        <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
          <Button variant="outline" onClick={onAdd}>
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
          wrapperClassName="border-0"
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
                  status: toggle.current === "ACTIVE" ? "INACTIVE" : "ACTIVE",
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
  const statusMutation = useUpdateProductFitmentStatus(companyUuid, productUuid)
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
          const isActive = (r.status ?? "ACTIVE") === "ACTIVE"
          return (
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <RowActionsMenu
                items={[
                  {
                    key: "status",
                    label: isActive ? "Deactivate" : "Activate",
                    icon: isActive ? Ban : RotateCcw,
                    variant: isActive ? "destructive" : "default",
                    onClick: () =>
                      setToggle({
                        uuid:
                          r.fitmentUuid ??
                          (r as { mappingUuid?: string }).mappingUuid ??
                          "",
                        version: r.version,
                        current: r.status ?? "ACTIVE",
                      }),
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Vehicle Fitments</CardTitle>
        <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
          <Button variant="outline" onClick={onAdd}>
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
          wrapperClassName="border-0"
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
                  status: toggle.current === "ACTIVE" ? "INACTIVE" : "ACTIVE",
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
          const isActive = (r.status ?? "ACTIVE") === "ACTIVE"
          return (
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <RowActionsMenu
                items={[
                  {
                    key: "status",
                    label: isActive ? "Deactivate" : "Activate",
                    icon: isActive ? Ban : RotateCcw,
                    variant: isActive ? "destructive" : "default",
                    onClick: () =>
                      setToggle({
                        uuid: r.geographyMappingUuid ?? r.mappingUuid ?? "",
                        version: r.version,
                        current: r.status ?? "ACTIVE",
                      }),
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Geography Availability</CardTitle>
        <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
          <Button variant="outline" onClick={onAdd}>
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
          wrapperClassName="border-0"
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
                  status: toggle.current === "ACTIVE" ? "INACTIVE" : "ACTIVE",
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
