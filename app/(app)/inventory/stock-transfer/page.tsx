"use client"

import { useMemo, useState } from "react"
import {
  ArrowLeftRight,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Plus,
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
import {
  DateRangePicker,
  type DateRangeValue,
} from "@/components/common/DateRangePicker"
import { RouteGate } from "@/components/auth/RouteGate"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"
import { getApiErrorMessage } from "@/lib/api/api-error"

import { useInventoryScope } from "@/features/inventory/hooks/use-inventory-scope"
import { useStockTransfers } from "@/features/inventory/hooks/use-stock-transfers"
import { useApproveStockTransfer } from "@/features/inventory/hooks/use-approve-stock-transfer"
import { useRejectStockTransfer } from "@/features/inventory/hooks/use-reject-stock-transfer"
import { stockTransferKeys } from "@/features/inventory/api/inventory-keys"
import type { StockDocument } from "@/features/inventory/api/inventory.types"
import { InventoryScopeBar } from "@/features/inventory/components/InventoryScopeBar"
import { GodownCombobox } from "@/features/inventory/components/GodownCombobox"
import { StockTransferFormDialog } from "@/features/inventory/components/StockTransferFormDialog"
import { StockDecisionDialog } from "@/features/inventory/components/StockDecisionDialog"
import { StockDocumentDetailDialog } from "@/features/inventory/components/StockDocumentDetailDialog"
import { formatDate, formatQuantity, lineMovement } from "@/features/inventory/components/inventory-format"

const STATUS_ITEMS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
] as const

export default function StockTransferPage() {
  return (
    <RouteGate permission={PERMISSIONS.STOCK_TRANSFER.VIEW}>
      <StockTransferContent />
    </RouteGate>
  )
}

function StockTransferContent() {
  const scope = useInventoryScope()
  const { companyUuid, distributorUuid, isDistributorUser } = scope
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [godownUuid, setGodownUuid] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [dateRange, setDateRange] = useState<DateRangeValue>({})
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const [createOpen, setCreateOpen] = useState(false)
  const [detail, setDetail] = useState<{
    uuid: string
    fallback: StockDocument | null
  } | null>(null)
  const [decision, setDecision] = useState<{
    mode: "approve" | "reject"
    document: StockDocument
  } | null>(null)

  const { data, isLoading, error, refetch } = useStockTransfers(
    companyUuid,
    distributorUuid ?? "",
    {
      godown: godownUuid ?? undefined,
      status:
        statusFilter === "ALL"
          ? undefined
          : (statusFilter as "PENDING" | "APPROVED" | "REJECTED"),
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
      search: search || undefined,
      page,
      size,
    },
    { enabled: !!distributorUuid }
  )

  const approveMutation = useApproveStockTransfer(
    companyUuid,
    distributorUuid ?? ""
  )
  const rejectMutation = useRejectStockTransfer(
    companyUuid,
    distributorUuid ?? ""
  )

  const documents = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const canDecide = !isDistributorUser

  const decisionMutation =
    decision?.mode === "reject" ? rejectMutation : approveMutation

  const openDetail = (document: StockDocument) =>
    setDetail({ uuid: document.uuid, fallback: document })

  const openDecision = (
    document: StockDocument,
    mode: "approve" | "reject"
  ) => setDecision({ mode, document })

  const columns = useMemo<DataTableColumn<StockDocument>[]>(
    () => [
      {
        id: "reference",
        header: "Reference",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.referenceNo}</span>
        ),
      },
      {
        id: "date",
        header: "Date",
        cell: ({ row }) =>
          formatDate(
            row.original.transferDate ?? row.original.documentDate ?? null
          ),
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
        id: "movement",
        header: "Movement",
        cell: ({ row }) => {
          const lines = row.original.lines ?? []
          const first = lines[0]
          return (
            <div className="flex flex-wrap items-center gap-1">
              {first ? (
                <Badge variant="outline" className="font-mono">
                  {lineMovement(first)}
                </Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              {lines.length > 1 ? (
                <span className="text-xs text-muted-foreground">
                  +{lines.length - 1} more
                </span>
              ) : null}
            </div>
          )
        },
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
                      permission={PERMISSIONS.STOCK_TRANSFER.APPROVE}
                    >
                      <DropdownMenuItem
                        onClick={() => openDecision(document, "approve")}
                      >
                        <CheckCircle2 className="mr-2 size-4 text-green-600" />{" "}
                        Approve
                      </DropdownMenuItem>
                    </PermissionGate>
                    <PermissionGate
                      permission={PERMISSIONS.STOCK_TRANSFER.APPROVE}
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
        title="Stock Transfer"
        description="Move stock between stock types inside a godown."
        action={
          <PermissionGate permission={PERMISSIONS.STOCK_TRANSFER.CREATE}>
            <Button
              onClick={() => setCreateOpen(true)}
              disabled={!distributorUuid}
            >
              <Plus className="mr-2 size-4" /> Create transfer
            </Button>
          </PermissionGate>
        }
      />

      <InventoryScopeBar scope={scope} />

      {!scope.hydrated ? null : !distributorUuid ? (
        <p className="rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          Select a distributor to view stock transfers.
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
            <DateRangePicker
              value={dateRange}
              onValueChange={(value) => {
                setDateRange(value)
                setPage(0)
              }}
              placeholder="Transfer date range"
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
          </div>

          <DataTable
            columns={columns}
            data={documents}
            getRowId={(document) => document.uuid}
            isLoading={isLoading}
            error={error}
            onRetry={() => void refetch()}
            onRowClick={openDetail}
            empty={{
              icon: ArrowLeftRight,
              title: "No stock transfers found",
              description:
                search ||
                statusFilter !== "ALL" ||
                godownUuid ||
                dateRange.from ||
                dateRange.to
                  ? "Try a different search or clear the filters."
                  : "Create a transfer to move stock between types.",
              action: (
                <PermissionGate
                  permission={PERMISSIONS.STOCK_TRANSFER.CREATE}
                >
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 size-4" /> Create transfer
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

      <StockTransferFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
        distributorUuid={distributorUuid ?? ""}
        defaultGodownUuid={godownUuid}
        onCreated={(document) => {
          void refetch()
          setDetail({ uuid: document.uuid, fallback: document })
        }}
      />

      <StockDocumentDetailDialog
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        companyUuid={companyUuid}
        distributorUuid={distributorUuid ?? ""}
        kind="transfer"
        documentUuid={detail?.uuid}
        fallback={detail?.fallback}
        canDecide={canDecide}
        onDecisionRequest={(document, mode) => openDecision(document, mode)}
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
              input: { version: decision.document.version, remarks },
            },
            {
              onSuccess: () => {
                toast.success(
                  decision.mode === "approve"
                    ? "Transfer approved — stock moved"
                    : "Transfer rejected"
                )
                if (detail) {
                  void queryClient.invalidateQueries({
                    queryKey: stockTransferKeys.detail(
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
                      ? "Could not approve transfer"
                      : "Could not reject transfer"
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
