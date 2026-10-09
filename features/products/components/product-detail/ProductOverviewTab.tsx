"use client"

import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  ProductResponse,
  UomConversion,
} from "@/features/products/api/product.types"

export function ProductOverviewTab({ product }: { product: ProductResponse }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <InfoRow label="Code" value={product.code} mono />
          <InfoRow label="Name" value={product.name} />
          <InfoRow label="Short Name" value={product.shortName ?? "—"} />
          <InfoRow label="Description" value={product.description ?? "—"} />
          <InfoRow label="Product Type" value={product.productType ?? "—"} />
          <InfoRow label="Category" value={product.category?.name ?? "—"} />
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
          <InfoRow label="Base UOM" value={product.baseUom?.name ?? "—"} />
          <InfoRow label="Sales UOM" value={product.salesUom?.name ?? "—"} />
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
