"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle2,
  Eye,
  History,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
  Upload,
  XCircle,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { PageHeader } from "@/components/common/PageHeader"
import { SearchInput } from "@/components/common/SearchInput"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ExportDropdown } from "@/components/common/ExportDropdown"
import {
  DateRangePicker,
  type DateRangeValue,
} from "@/components/common/DateRangePicker"
import { RouteGate } from "@/components/auth/RouteGate"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"
import { getApiErrorMessage } from "@/lib/api/api-error"

import { useInventoryScope } from "@/features/inventory/hooks/use-inventory-scope"
import { useStockAdjustments } from "@/features/inventory/hooks/use-stock-adjustments"
import { useApproveStockAdjustment } from "@/features/inventory/hooks/use-approve-stock-adjustment"
import { useRejectStockAdjustment } from "@/features/inventory/hooks/use-reject-stock-adjustment"
import { exportStockAdjustments } from "@/features/inventory/api/stock-adjustment.api"
import {
  stockAdjustmentKeys,
  stockSummaryKeys,
} from "@/features/inventory/api/inventory-keys"
import type { StockDocument } from "@/features/inventory/api/inventory.types"
import { InventoryScopeBar } from "@/features/inventory/components/InventoryScopeBar"
import { GodownCombobox } from "@/features/inventory/components/GodownCombobox"
import { StockAdjustmentFormDialog } from "@/features/inventory/components/StockAdjustmentFormDialog"
import { StockAdjustmentImportDialog } from "@/features/inventory/components/StockAdjustmentImportDialog"
import { StockAdjustmentImportHistoryDialog } from "@/features/inventory/components/StockAdjustmentImportHistoryDialog"
import { StockAdjustmentNotifications } from "@/features/inventory/components/StockAdjustmentNotifications"
import { StockDecisionDialog } from "@/features/inventory/components/StockDecisionDialog"
import { StockDocumentDetailDialog } from "@/features/inventory/components/StockDocumentDetailDialog"
import {
  documentDate,
  formatDate,
  formatQuantity,
  transactionTypeLabel,
} from "@/features/inventory/components/inventory-format"

const STATUS_ITEMS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
] as const

const DIRECTION_ITEMS = [
  { value: "ALL", label: "All directions" },
  { value: "IN", label: "Stock in" },
  { value: "OUT", label: "Stock out" },
] as const

export default function StockAdjustmentPage() {
  return (
    <RouteGate permission={PERMISSIONS.STOCK_ADJUSTMENT.VIEW}>
      <StockAdjustmentContent />
    </RouteGate>
  )
}

function StockAdjustmentContent() {
  const scope = useInventoryScope()
  const { companyUuid, distributorUuid, isDistributorUser } = scope
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [godownUuid, setGodownUuid] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [directionFilter, setDirectionFilter] = useState("ALL")
  const [dateRange, setDateRange] = useState<DateRangeValue>({})
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [detail, setDetail] = useState<{
    uuid: string
    fallback: StockDocument | null
  } | null>(null)
  const [decision, setDecision] = useState<{
    mode: "approve" | "reject"
    document: StockDocument
  } | null>(null)

  const filters = useMemo(
    () => ({
      godown: godownUuid ?? undefined,
      status:
        statusFilter === "ALL"
          ? undefined
          : (statusFilter as "PENDING" | "APPROVED" | "REJECTED"),
      direction:
        directionFilter === "ALL"
          ? undefined
          : (directionFilter as "IN" | "OUT"),
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
      search: search || undefined,
    }),
    [godownUuid, statusFilter, directionFilter, dateRange, search]
  )

  const { data, isLoading, error, refetch } = useStockAdjustments(
    companyUuid,
    distributorUuid ?? "",
    { ...filters, page, size },
    { enabled: !!distributorUuid }
  )

  const approveMutation = useApproveStockAdjustment(
    companyUuid,
    distributorUuid ?? ""
  )
  const rejectMutation = useRejectStockAdjustment(
    companyUuid,
    distributorUuid ?? ""
  )

  const documents = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const pendingOnPage = documents.filter(
    (document) => document.status === "PENDING"
  ).length

  const decisionMutation =
    decision?.mode === "reject" ? rejectMutation : approveMutation
  const canDecide = !isDistributorUser

  const openDetail = (document: StockDocument) =>
    setDetail({ uuid: document.uuid, fallback: document })

  const openDecision = (
    document: StockDocument,
    mode: "approve" | "reject"
  ) => {
    setDecision({ mode, document })
  }

  const columns = useMemo<DataTableColumn<StockDocument>[]>(
    () => [
      {
        id: "reference",
        header: "Reference",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-sm">
              {row.original.referenceNo}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {row.original.source === "IMPORT" ? "Import" : "Manual"}
            </span>
          </div>
        ),
      },
      {
        id: "date",
        header: "Date",
        cell: ({ row }) => formatDate(documentDate(row.original)),
      },
      {
        id: "godown",
        header: "Godown",
        cell: ({ row }) =>
          row.original.godownCode && row.original.godownName ? (
            <div className="flex flex-col">
              <span className="font-medium">{row.original.godownName}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {row.original.godownCode}
              </span>
            </div>
          ) : (
            <span className="font-mono text-xs">
              {row.original.godownUuid}
            </span>
          ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">
              {transactionTypeLabel(row.original.transactionType)}
            </span>
            {row.original.direction ? (
              <Badge
                variant={
                  row.original.direction === "OUT" ? "destructive" : "secondary"
                }
                className="w-fit text-[10px]"
              >
                {row.original.direction === "OUT" ? "Stock out" : "Stock in"}
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: "reason",
        header: "Reason",
        cell: ({ row }) => row.original.reason ?? "—",
      },
      {
        id: "documentNumber",
        header: "Document no.",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.documentNumber ?? "—"}
          </span>
        ),
      },
      {
        id: "quantity",
        header: "Qty",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatQuantity(row.original.totalQuantity ?? 0)}
            <span className="ml-1 text-xs text-muted-foreground">
              / {row.original.totalProducts ?? row.original.lines?.length ?? 0}{" "}
              item
              {(row.original.totalProducts ?? row.original.lines?.length ?? 0) ===
              1
                ? ""
                : "s"}
            </span>
          </span>
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
          const document = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
                aria-label={`Actions for ${document.referenceNo}`}
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                <DropdownMenuItem onClick={() => openDetail(document)}>
                  <Eye className="mr-2 size-4" /> View details
                </DropdownMenuItem>
                {document.status === "PENDING" && canDecide ? (
                  <>
                    <DropdownMenuSeparator />
                    <PermissionGate
                      permission={PERMISSIONS.STOCK_ADJUSTMENT.APPROVE}
                    >
                      <DropdownMenuItem
                        onClick={() => openDecision(document, "approve")}
                      >
                        <CheckCircle2 className="mr-2 size-4 text-green-600" />{" "}
                        Approve
                      </DropdownMenuItem>
                    </PermissionGate>
                    <PermissionGate
                      permission={PERMISSIONS.STOCK_ADJUSTMENT.APPROVE}
                    >
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => openDecision(document, "reject")}
                      >
                        <XCircle className="mr-2 size-4" /> Reject
                      </DropdownMenuItem>
                    </PermissionGate>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [canDecide]
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Stock Adjustment"
        description="Manual stock-in and stock-out documents with approval."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {distributorUuid ? (
              <StockAdjustmentNotifications
                companyUuid={companyUuid}
                distributorUuid={distributorUuid}
                onOpenAdjustment={(uuid) =>
                  setDetail({ uuid, fallback: null })
                }
              />
            ) : null}
            <PermissionGate permission={PERMISSIONS.STOCK_ADJUSTMENT.IMPORT}>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 size-4" /> Import
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.STOCK_ADJUSTMENT.IMPORT}>
              <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                <History className="mr-2 size-4" /> Import history
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.STOCK_ADJUSTMENT.CREATE}>
              <Button
                onClick={() => setCreateOpen(true)}
                disabled={!distributorUuid}
              >
                <Plus className="mr-2 size-4" /> Create adjustment
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <InventoryScopeBar scope={scope} />

      {!scope.hydrated ? null : !distributorUuid ? (
        <p className="rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          Select a distributor to view stock adjustments.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-64">
              <GodownCombobox
                companyUuid={companyUuid}
                distributorUuid={distributorUuid}
                value={godownUuid}
                onValueChange={(value) => {
                  setGodownUuid(value)
                  setPage(0)
                }}
                placeholder="Filter by godown..."
              />
            </div>
            <Select
              items={STATUS_ITEMS}
              value={statusFilter}
              onValueChange={(value: string | null) => {
                if (!value) return
                setStatusFilter(value)
                setPage(0)
              }}
            >
              <SelectTrigger aria-label="Filter by status" className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={DIRECTION_ITEMS}
              value={directionFilter}
              onValueChange={(value: string | null) => {
                if (!value) return
                setDirectionFilter(value)
                setPage(0)
              }}
            >
              <SelectTrigger aria-label="Filter by direction" className="w-full sm:w-40">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                {DIRECTION_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangePicker
              value={dateRange}
              onValueChange={(value) => {
                setDateRange(value)
                setPage(0)
              }}
              placeholder="Adjustment date range"
              disableFuture
              className="w-full sm:w-64"
            />
            <SearchInput
              placeholder="Search reference, document no. or remarks..."
              defaultValue={search}
              onChange={(value) => {
                setSearch(value)
                setPage(0)
              }}
            />
            <div className="ml-auto">
              <ExportDropdown
                permission={PERMISSIONS.STOCK_ADJUSTMENT.VIEW}
                baseFileName="stock-adjustments-export"
                onExport={(format) =>
                  exportStockAdjustments(
                    companyUuid,
                    distributorUuid,
                    format,
                    filters
                  )
                }
              />
            </div>
          </div>

          {pendingOnPage > 0 ? (
            <p className="text-xs text-muted-foreground">
              {pendingOnPage} pending document
              {pendingOnPage === 1 ? "" : "s"} on this page — stock moves only
              after approval.
            </p>
          ) : null}

          <DataTable
            columns={columns}
            data={documents}
            getRowId={(document) => document.uuid}
            isLoading={isLoading}
            error={error}
            onRetry={() => void refetch()}
            onRowClick={openDetail}
            empty={{
              icon: SlidersHorizontal,
              title: "No stock adjustments found",
              description:
                search ||
                statusFilter !== "ALL" ||
                directionFilter !== "ALL" ||
                godownUuid ||
                dateRange.from ||
                dateRange.to
                  ? "Try a different search or clear the filters."
                  : "Create an adjustment to record stock in or out.",
              action: (
                <PermissionGate
                  permission={PERMISSIONS.STOCK_ADJUSTMENT.CREATE}
                >
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 size-4" /> Create adjustment
                  </Button>
                </PermissionGate>
              ),
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

      <StockAdjustmentFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
        distributorUuid={distributorUuid ?? ""}
        defaultGodownUuid={godownUuid}
        onCreated={(document) => {
          void queryClient.invalidateQueries({
            queryKey: stockAdjustmentKeys.notifications(companyUuid, distributorUuid ?? ""),
          })
          void queryClient.invalidateQueries({
            queryKey: stockSummaryKeys.all(companyUuid, distributorUuid ?? ""),
          })
          void refetch()
          setDetail({ uuid: document.uuid, fallback: document })
        }}
      />

      <StockAdjustmentImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => {
          void refetch()
          if (distributorUuid) {
            void queryClient.invalidateQueries({
              queryKey: stockSummaryKeys.all(companyUuid, distributorUuid),
            })
          }
        }}
      />

      <StockAdjustmentImportHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        companyUuid={companyUuid}
      />

      <StockDocumentDetailDialog
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        companyUuid={companyUuid}
        distributorUuid={distributorUuid ?? ""}
        kind="adjustment"
        documentUuid={detail?.uuid}
        fallback={detail?.fallback}
        canDecide={canDecide}
        onDecisionRequest={(document, mode) =>
          openDecision(document, mode)
        }
      />

      <StockDecisionDialog
        open={!!decision}
        onOpenChange={(open) => !open && setDecision(null)}
        mode={decision?.mode ?? "approve"}
        document={decision?.document ?? null}
        isPending={decisionMutation.isPending}
        onConfirm={(remarks) => {
          if (!decision) return
          decisionMutation.mutate(
            {
              documentUuid: decision.document.uuid,
              input: {
                version: decision.document.version,
                remarks,
              },
            },
            {
              onSuccess: () => {
                toast.success(
                  decision.mode === "approve"
                    ? "Adjustment approved — stock posted"
                    : "Adjustment rejected"
                )
                if (detail) {
                  void queryClient.invalidateQueries({
                    queryKey: stockAdjustmentKeys.detail(
                      companyUuid,
                      distributorUuid ?? "",
                      detail.uuid
                    ),
                  })
                }
                setDecision(null)
              },
              onError: (err) => {
                toast.error(
                  getApiErrorMessage(
                    err,
                    decision.mode === "approve"
                      ? "Could not approve adjustment"
                      : "Could not reject adjustment"
                  ),
                  { duration: 7000 }
                )
              },
            }
          )
        }}
      />
    </div>
  )
}
