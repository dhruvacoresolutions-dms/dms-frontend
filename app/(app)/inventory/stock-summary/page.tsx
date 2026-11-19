"use client"

import { useMemo, useState } from "react"
import { Boxes, PackageSearch } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { PageHeader } from "@/components/common/PageHeader"
import { RouteGate } from "@/components/auth/RouteGate"
import { Spinner } from "@/components/ui/spinner"
import { useAuthStore } from "@/stores/auth-store"
import { useProduct } from "@/features/products/hooks/use-product"
import { PERMISSIONS } from "@/lib/permissions"

import { useInventoryScope } from "@/features/inventory/hooks/use-inventory-scope"
import { useGodowns } from "@/features/inventory/hooks/use-godowns"
import { useStockSummary } from "@/features/inventory/hooks/use-stock-summary"
import { useDebouncedValue } from "@/features/inventory/hooks/use-scoped-products"
import { InventoryScopeBar } from "@/features/inventory/components/InventoryScopeBar"
import { GodownCombobox } from "@/features/inventory/components/GodownCombobox"
import { ScopedProductCombobox } from "@/features/inventory/components/ScopedProductCombobox"
import { useStockTypeOptions } from "@/features/inventory/components/stock-type-select"
import { formatQuantity, stockTypeName } from "@/features/inventory/components/inventory-format"
import type {
  StockSummaryGroupBy,
  StockSummaryRow,
  StockTypeCode,
} from "@/features/inventory/api/inventory.types"

const GROUP_BY_ITEMS = [
  { value: "batch", label: "Batch" },
  { value: "godown", label: "Godown" },
  { value: "product", label: "Product" },
  { value: "stockType", label: "Stock type" },
] as const

export default function StockSummaryPage() {
  return (
    <RouteGate permission={PERMISSIONS.STOCK_SUMMARY.VIEW}>
      <StockSummaryContent />
    </RouteGate>
  )
}

function StockSummaryContent() {
  const scope = useInventoryScope()
  const { companyUuid, distributorUuid } = scope

  const [godownUuid, setGodownUuid] = useState<string | null>(null)
  const [productUuid, setProductUuid] = useState<string | null>(null)
  const [stockType, setStockType] = useState("ALL")
  const [batch, setBatch] = useState("")
  const [groupBy, setGroupBy] = useState<StockSummaryGroupBy>("batch")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)

  const debouncedBatch = useDebouncedValue(batch, 400)
  const { options: stockTypeOptions } = useStockTypeOptions(
    companyUuid,
    distributorUuid ?? ""
  )

  const { data, isLoading, error, refetch } = useStockSummary(
    companyUuid,
    distributorUuid ?? "",
    {
      godown: godownUuid ?? undefined,
      product: productUuid ?? undefined,
      stockType:
        stockType === "ALL" ? undefined : (stockType as StockTypeCode),
      batch: debouncedBatch.trim() || undefined,
      groupBy,
      page,
      size,
    },
    { enabled: !!distributorUuid }
  )

  const godownQuery = useGodowns(
    companyUuid,
    distributorUuid ?? "",
    { page: 0, size: 100 },
    { enabled: !!distributorUuid }
  )

  const godownMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const godown of godownQuery.data?.content ?? []) {
      map.set(
        godown.uuid,
        `${godown.godownCode} · ${godown.godownName}`
      )
    }
    return map
  }, [godownQuery.data?.content])

  const rows = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<StockSummaryRow>[]>(() => {
    const quantityColumn: DataTableColumn<StockSummaryRow> = {
      id: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatQuantity(row.original.quantity)}
        </span>
      ),
      className: "text-right",
    }

    const godownColumn: DataTableColumn<StockSummaryRow> = {
      id: "godown",
      header: "Godown",
      cell: ({ row }) => (
        <GodownLabel
          uuid={row.original.godownUuid}
          name={
            row.original.godownUuid
              ? godownMap.get(row.original.godownUuid)
              : null
          }
        />
      ),
    }

    const productColumn: DataTableColumn<StockSummaryRow> = {
      id: "product",
      header: "Product",
      cell: ({ row }) => (
        <ProductLabel
          companyUuid={companyUuid}
          productUuid={row.original.productUuid}
        />
      ),
    }

    const batchColumn: DataTableColumn<StockSummaryRow> = {
      id: "batch",
      header: "Batch",
      cell: ({ row }) =>
        row.original.batchCode ? (
          <span className="font-mono text-xs">{row.original.batchCode}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Batch-less</span>
        ),
    }

    const stockTypeColumn: DataTableColumn<StockSummaryRow> = {
      id: "stockType",
      header: "Stock type",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.stockType ?? "—"}
          <span className="ml-1 font-sans">
            {stockTypeName(row.original.stockType)}
          </span>
        </Badge>
      ),
    }

    switch (groupBy) {
      case "godown":
        return [godownColumn, quantityColumn]
      case "product":
        return [productColumn, quantityColumn]
      case "stockType":
        return [stockTypeColumn, quantityColumn]
      default:
        return [
          godownColumn,
          productColumn,
          batchColumn,
          stockTypeColumn,
          quantityColumn,
        ]
    }
  }, [groupBy, godownMap, companyUuid])

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Stock Summary"
        description="Current balances by godown, product, batch and stock type. Only approved documents affect these numbers."
      />

      <InventoryScopeBar scope={scope} />

      {!scope.hydrated ? null : !distributorUuid ? (
        <p className="rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          Select a distributor to view stock balances.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-full sm:w-60">
              <p className="mb-1 text-xs text-muted-foreground">Godown</p>
              <GodownCombobox
                companyUuid={companyUuid}
                distributorUuid={distributorUuid}
                value={godownUuid}
                onValueChange={(value) => {
                  setGodownUuid(value)
                  setProductUuid(null)
                  setPage(0)
                }}
                placeholder="All godowns"
              />
            </div>
            <div className="w-full sm:w-60">
              <p className="mb-1 text-xs text-muted-foreground">Product</p>
              <ScopedProductCombobox
                companyUuid={companyUuid}
                distributorUuid={distributorUuid}
                godownUuid={godownUuid}
                value={productUuid}
                onValueChange={(value) => {
                  setProductUuid(value)
                  setPage(0)
                }}
                placeholder="All products"
              />
            </div>
            <div className="w-full sm:w-40">
              <p className="mb-1 text-xs text-muted-foreground">Stock type</p>
              <Select
                items={[
                  { value: "ALL", label: "All types" },
                  ...stockTypeOptions,
                ]}
                value={stockType}
                onValueChange={(value: string | null) => {
                  if (!value) return
                  setStockType(value)
                  setPage(0)
                }}
              >
                <SelectTrigger aria-label="Filter by stock type" className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  {stockTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-44">
              <p className="mb-1 text-xs text-muted-foreground">Batch</p>
              <Input
                value={batch}
                onChange={(event) => {
                  setBatch(event.target.value)
                  setPage(0)
                }}
                placeholder="Exact batch code"
              />
            </div>
            <div className="w-full sm:w-40">
              <p className="mb-1 text-xs text-muted-foreground">Group by</p>
              <Select
                items={GROUP_BY_ITEMS}
                value={groupBy}
                onValueChange={(value: string | null) => {
                  if (!value) return
                  setGroupBy(value as StockSummaryGroupBy)
                  setPage(0)
                }}
              >
                <SelectTrigger aria-label="Group stock summary by">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_BY_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(godownUuid || productUuid || stockType !== "ALL" || batch) ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setGodownUuid(null)
                  setProductUuid(null)
                  setStockType("ALL")
                  setBatch("")
                  setPage(0)
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </div>

          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row, index) =>
              [
                row.godownUuid,
                row.productUuid,
                row.batchCode,
                row.stockType,
                index,
              ]
                .filter(Boolean)
                .join("-")
            }
            isLoading={isLoading}
            error={error}
            onRetry={() => void refetch()}
            empty={{
              icon: groupBy === "product" ? PackageSearch : Boxes,
              title: "No stock balances found",
              description:
                godownUuid || productUuid || stockType !== "ALL" || batch
                  ? "No balances match these filters. Try clearing them."
                  : "Balances appear here after approved stock documents post.",
            }}
            pagination={{
              page,
              totalPages,
              totalElements: data?.totalElements,
              onPageChange: setPage,
              pageSize: size,
              onPageSizeChange: (next) => {
                setSize(next)
                setPage(0)
              },
            }}
          />
        </>
      )}
    </div>
  )
}

function GodownLabel({
  uuid,
  name,
}: {
  uuid?: string | null
  name?: string | null
}) {
  if (!uuid) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex flex-col">
      <span className="font-medium">{name ?? "Unknown godown"}</span>
      {!name ? (
        <span className="font-mono text-[11px] text-muted-foreground">
          {uuid}
        </span>
      ) : null}
    </div>
  )
}

function ProductLabel({
  companyUuid,
  productUuid,
}: {
  companyUuid: string
  productUuid?: string | null
}) {
  const session = useAuthStore((state) => state.session)
  const resolvedCompanyUuid = companyUuid || session?.user?.companyUuid || ""
  const { data, isLoading } = useProduct(
    resolvedCompanyUuid,
    productUuid ?? ""
  )

  if (!productUuid) return <span className="text-muted-foreground">—</span>
  if (isLoading) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Spinner className="size-3" /> Loading…
      </span>
    )
  }
  if (!data) {
    return (
      <span className="font-mono text-xs text-muted-foreground">
        {productUuid.slice(0, 8)}…
      </span>
    )
  }
  return (
    <div className="flex flex-col">
      <span className="font-medium">{data.name}</span>
      <span className="font-mono text-[11px] text-muted-foreground">
        {data.code}
      </span>
    </div>
  )
}
