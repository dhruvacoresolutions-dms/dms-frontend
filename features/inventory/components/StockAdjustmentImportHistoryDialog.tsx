"use client"

import * as React from "react"
import { ArrowLeft, Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { downloadBlob } from "@/lib/file-download"
import { PERMISSIONS } from "@/lib/permissions"
import { useStockAdjustmentImports } from "../hooks/use-stock-adjustment-imports"
import { useStockAdjustmentImportJob } from "../hooks/use-stock-adjustment-import-job"
import {
  downloadStockAdjustmentImportOriginal,
  downloadStockAdjustmentImportResults,
} from "../api/stock-adjustment-import.api"
import type { StockImportHistoryItem } from "../api/inventory.types"
import { formatDateTime } from "./inventory-format"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
}

export function StockAdjustmentImportHistoryDialog({
  open,
  onOpenChange,
  companyUuid,
}: Props) {
  const [page, setPage] = React.useState(0)
  const [size, setSize] = React.useState(10)
  const [selected, setSelected] = React.useState<StockImportHistoryItem | null>(
    null
  )

  const { data, isLoading, error, refetch } = useStockAdjustmentImports(
    companyUuid,
    { page, size },
    { enabled: open }
  )

  const rows = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelected(null)
      setPage(0)
    }
    onOpenChange(next)
  }

  const columns = React.useMemo<DataTableColumn<StockImportHistoryItem>[]>(
    () => [
      {
        id: "file",
        header: "File",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.originalFilename ?? "Stock adjustments import"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "uploadedAt",
        header: "Uploaded",
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: "rows",
        header: "Rows",
        cell: ({ row }) => {
          const total = row.original.totalRows ?? 0
          const failed = row.original.failedRows ?? 0
          const ok = row.original.successRows ?? total - failed
          return (
            <span className="text-sm tabular-nums">
              {ok}/{total}
              {failed > 0 ? (
                <span className="ml-1 text-destructive">({failed} failed)</span>
              ) : null}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(row.original)}
          >
            Details
          </Button>
        ),
      },
    ],
    []
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {selected ? (
          <ImportJobDetail
            companyUuid={companyUuid}
            item={selected}
            onBack={() => setSelected(null)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="size-4" aria-hidden="true" />
                Stock adjustment import history
              </DialogTitle>
              <DialogDescription>
                Past bulk uploads, row results and original files. Imports are
                company-side only.
              </DialogDescription>
            </DialogHeader>

            <DataTable
              columns={columns}
              data={rows}
              getRowId={(row, index) => row.jobUuid || `import-${index}`}
              isLoading={isLoading}
              error={error}
              onRetry={() => void refetch()}
              empty={{
                title: "No imports yet",
                description:
                  "Upload a stock adjustment file to see its results here.",
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
      </DialogContent>
    </Dialog>
  )
}

function ImportJobDetail({
  companyUuid,
  item,
  onBack,
}: {
  companyUuid: string
  item: StockImportHistoryItem
  onBack: () => void
}) {
  const { data, isLoading, error } = useStockAdjustmentImportJob(
    companyUuid,
    item.jobUuid,
    { enabled: !!item.jobUuid }
  )
  const [downloading, setDownloading] = React.useState<string | null>(null)

  const job = data
  const diagnostics = job?.diagnostics ?? []

  const download = async (
    key: string,
    fn: () => Promise<Blob>,
    filename: string
  ) => {
    try {
      setDownloading(key)
      const blob = await fn()
      downloadBlob(blob, filename)
      toast.success("Download started")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Download failed"))
    } finally {
      setDownloading(null)
    }
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to history</span>
          </Button>
          <DialogTitle>Import result</DialogTitle>
        </div>
        <DialogDescription>
          {item.originalFilename ?? "Stock adjustment import"} ·{" "}
          {formatDateTime(item.createdAt)}
        </DialogDescription>
      </DialogHeader>

      {isLoading && !job ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Spinner className="size-4" /> Loading import result…
        </div>
      ) : error ? (
        <p className="py-8 text-center text-sm text-destructive">
          {getApiErrorMessage(error, "Could not load this import job.")}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-4">
            <Stat label="Status" value={<StatusBadge status={job?.status ?? item.status} />} />
            <Stat label="Total rows" value={job?.totalRows ?? item.totalRows} />
            <Stat
              label="Succeeded"
              value={job?.successRows ?? item.successRows}
            />
            <Stat
              label="Failed"
              value={job?.failedRows ?? item.failedRows}
              destructive={(job?.failedRows ?? item.failedRows) > 0}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <PermissionGate permission={PERMISSIONS.STOCK_ADJUSTMENT.IMPORT}>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  download(
                    "csv",
                    () =>
                      downloadStockAdjustmentImportResults(
                        companyUuid,
                        item.jobUuid,
                        "csv"
                      ),
                    "stock-adjustment-import-results.csv"
                  )
                }
                disabled={downloading !== null}
              >
                {downloading === "csv" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Download className="mr-2 size-4" />
                )}
                Results CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  download(
                    "xlsx",
                    () =>
                      downloadStockAdjustmentImportResults(
                        companyUuid,
                        item.jobUuid,
                        "xlsx"
                      ),
                    "stock-adjustment-import-results.xlsx"
                  )
                }
                disabled={downloading !== null}
              >
                {downloading === "xlsx" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Download className="mr-2 size-4" />
                )}
                Results XLSX
              </Button>
            </PermissionGate>
            {item.attachmentAvailable ? (
              <PermissionGate permission={PERMISSIONS.FILE.IMPORT_DOWNLOAD}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border px-3 text-[0.8rem] font-medium hover:bg-muted"
                    disabled={downloading !== null}
                  >
                    <Download className="size-3.5" /> Original file
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        download(
                          "original",
                          () =>
                            downloadStockAdjustmentImportOriginal(
                              companyUuid,
                              item.jobUuid
                            ),
                          item.originalFilename ?? "import-original"
                        )
                      }
                    >
                      Download original upload
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      Stored original may be purged after retention.
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionGate>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Row</th>
                  <th className="px-3 py-2 text-left font-medium">Field</th>
                  <th className="px-3 py-2 text-left font-medium">Value</th>
                  <th className="px-3 py-2 text-left font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {diagnostics.map((diagnostic, index) => (
                  <tr
                    key={`${diagnostic.rowNumber}-${diagnostic.field}-${index}`}
                    className="border-t"
                  >
                    <td className="px-3 py-2 tabular-nums">
                      {diagnostic.rowNumber}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {diagnostic.field}
                    </td>
                    <td className="max-w-40 truncate px-3 py-2 text-xs">
                      {diagnostic.rejectedValue ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {diagnostic.reason}
                    </td>
                  </tr>
                ))}
                {diagnostics.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-sm text-muted-foreground"
                    >
                      No row errors — this import completed cleanly.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function Stat({
  label,
  value,
  destructive,
}: {
  label: string
  value: React.ReactNode
  destructive?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={
          destructive
            ? "text-lg font-semibold tabular-nums text-destructive"
            : "text-lg font-semibold tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  )
}
