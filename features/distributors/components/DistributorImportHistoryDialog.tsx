"use client"

import * as React from "react"
import { format } from "date-fns"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { downloadBlob } from "@/lib/file-download"
import { useDistributorImportHistory } from "../hooks/use-distributor-import-history"
import { useDistributorImportJob } from "../hooks/use-distributor-import-job"
import {
  downloadDistributorImportOriginal,
  downloadDistributorImportResults,
} from "../api/distributor.api"
import type { DistributorImportHistoryItem } from "../api/distributor.types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
}

function jobUuidOf(item: DistributorImportHistoryItem): string {
  return item.jobUuid ?? item.importJobUuid ?? ""
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return format(d, "dd MMM yyyy, hh:mm a")
}

export function DistributorImportHistoryDialog({
  open,
  onOpenChange,
  companyUuid,
}: Props) {
  const [page, setPage] = React.useState(0)
  const [size, setSize] = React.useState(10)
  const [selected, setSelected] =
    React.useState<DistributorImportHistoryItem | null>(null)

  const { data, isLoading, error, refetch } = useDistributorImportHistory(
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

  const columns = React.useMemo<DataTableColumn<DistributorImportHistoryItem>[]>(
    () => [
      {
        id: "file",
        header: "File",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.originalFilename ?? "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge status={row.original.status ?? "PENDING"} />
        ),
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
            <span className="text-sm">
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
      <DialogContent className="sm:max-w-2xl">
        {selected ? (
          <DistributorImportJobDetail
            companyUuid={companyUuid}
            item={selected}
            onBack={() => setSelected(null)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Distributor import history</DialogTitle>
              <DialogDescription>
                Past distributor bulk uploads and their results.
              </DialogDescription>
            </DialogHeader>
            <DataTable
              columns={columns}
              data={rows}
              getRowId={(r, i) => jobUuidOf(r) || `row-${i}`}
              isLoading={isLoading}
              error={error}
              onRetry={() => void refetch()}
              empty={{
                title: "No imports yet",
                description: "Bulk upload a distributor file to see it here.",
              }}
              pagination={{
                page,
                totalPages,
                onPageChange: setPage,
                pageSize: size,
                onPageSizeChange: (s) => {
                  setSize(s)
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

function DistributorImportJobDetail({
  companyUuid,
  item,
  onBack,
}: {
  companyUuid: string
  item: DistributorImportHistoryItem
  onBack: () => void
}) {
  const jobUuid = jobUuidOf(item)
  const { data: job, isLoading, error, refetch } = useDistributorImportJob(
    companyUuid,
    jobUuid || null
  )
  const [downloading, setDownloading] = React.useState<
    "csv" | "xlsx" | "original" | null
  >(null)

  const total = job?.totalRows ?? item.totalRows ?? 0
  const failed = job?.failedRows ?? item.failedRows ?? 0
  const success = job?.successRows ?? item.successRows ?? total - failed
  const status = job?.status ?? item.status ?? "PENDING"
  const diagnostics = job?.diagnostics ?? []
  const fileName = job?.originalFilename ?? item.originalFilename ?? "import"

  const handleDownload = async (kind: "csv" | "xlsx" | "original") => {
    if (!jobUuid || downloading) return
    try {
      setDownloading(kind)
      const blob =
        kind === "original"
          ? await downloadDistributorImportOriginal(companyUuid, jobUuid)
          : await downloadDistributorImportResults(companyUuid, jobUuid, kind)
      const name =
        kind === "original"
          ? fileName
          : `${fileName.replace(/\.[^.]+$/, "")}-results.${kind}`
      downloadBlob(blob, name)
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
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <DialogTitle>Import details</DialogTitle>
            <DialogDescription className="truncate">
              {fileName}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="size-6" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-6 text-sm">
          <p className="text-muted-foreground">
            {getApiErrorMessage(error, "Failed to load import details")}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusBadge status={status} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total rows</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 text-center dark:border-green-800 dark:bg-green-950/30">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {success}
              </p>
              <p className="text-xs text-muted-foreground">Imported</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-center dark:border-red-800 dark:bg-red-950/30">
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {failed}
              </p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>

          {diagnostics.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-destructive">
                {diagnostics.length} row{diagnostics.length > 1 ? "s" : ""} failed
              </p>
              <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md bg-destructive/5 p-2 text-xs text-destructive/90">
                {diagnostics.map((d, i) => (
                  <li key={i} className="break-words">
                    Row {d.rowNumber ?? "?"}
                    {d.entityKey ? ` · ${d.entityKey}` : ""}
                    {d.field ? ` · ${d.field}` : ""}
                    {d.reason ?? d.message
                      ? ` — ${d.reason ?? d.message}`
                      : d.errorCode
                        ? ` — ${d.errorCode}`
                        : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={downloading !== null}
                  >
                    {downloading ? (
                      <Loader2 className="mr-2 size-3.5 animate-spin" />
                    ) : (
                      <Download className="mr-2 size-3.5" />
                    )}
                    {downloading ? "Downloading..." : "Download"}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                <DropdownMenuItem
                  disabled={downloading !== null}
                  onClick={() => void handleDownload("csv")}
                >
                  <Download className="mr-2 size-4" /> Results CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={downloading !== null}
                  onClick={() => void handleDownload("xlsx")}
                >
                  <Download className="mr-2 size-4" /> Results Excel
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={downloading !== null}
                  onClick={() => void handleDownload("original")}
                >
                  <Download className="mr-2 size-4" /> Original file
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </>
  )
}
