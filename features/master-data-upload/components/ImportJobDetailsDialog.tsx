"use client"

import * as React from "react"
import { format } from "date-fns"
import { Download, Loader2 } from "lucide-react"
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
import { StatusBadge } from "@/components/common/StatusBadge"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { downloadBlob } from "@/lib/file-download"
import { useImportJob } from "../hooks/use-import-job"
import {
  getImportResultsXlsx,
  getMasterTypeConfig,
  getOriginalImportFile,
} from "../api/master-data-upload.api"
import type {
  MasterDataType,
  UnifiedImportHistoryItem,
} from "../api/master-data-upload.types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  type: MasterDataType
  item: UnifiedImportHistoryItem | null
}

function formatDateTime(iso: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return format(d, "dd MMM yyyy, hh:mm a")
}

export function ImportJobDetailsDialog({
  open,
  onOpenChange,
  companyUuid,
  type,
  item,
}: Props) {
  const config = getMasterTypeConfig(type)
  const { data: job, isLoading, error, refetch } = useImportJob(
    companyUuid,
    type,
    item?.jobUuid ?? null,
    open
  )
  const [downloading, setDownloading] = React.useState<
    "csv" | "xlsx" | "original" | null
  >(null)

  const total = job?.totalRows ?? item?.totalRecords ?? 0
  const valid = job?.validRows ?? item?.successRecords ?? 0
  const invalid = job?.invalidRows ?? item?.failedRecords ?? 0
  const diagnostics = job?.diagnostics ?? []
  const status = job?.status ?? item?.status ?? "PENDING"
  const fileBase =
    item?.fileName.replace(/\.[^.]+$/, "") || `${type}-import-results`

  const handleDownload = async (kind: "csv" | "xlsx" | "original") => {
    if (!item || downloading) return
    try {
      setDownloading(kind)
      const blob =
        kind === "csv"
          ? await config.getResultsCsv(companyUuid, item.jobUuid)
          : kind === "xlsx"
            ? await getImportResultsXlsx(type, companyUuid, item.jobUuid)
            : await getOriginalImportFile(type, companyUuid, item.jobUuid)
      const ext = kind === "original" ? "" : `.${kind}`
      downloadBlob(blob, kind === "original" ? item.fileName : `${fileBase}${ext}`)
      toast.success("Download started")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Download failed"))
    } finally {
      setDownloading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload details</DialogTitle>
          <DialogDescription className="truncate">
            {item?.fileName ?? "Import job"}
          </DialogDescription>
        </DialogHeader>

        {!item ? null : isLoading && !job ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6" />
          </div>
        ) : error && !job ? (
          <div className="flex flex-col items-center gap-3 py-6 text-sm">
            <p className="text-muted-foreground">
              {getApiErrorMessage(error, "Failed to load upload details")}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Master data type</dt>
                <dd className="font-medium">{config.label}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Uploaded on</dt>
                <dd className="font-medium">{formatDateTime(item.uploadedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Uploaded by</dt>
                <dd
                  className="truncate font-mono text-xs font-medium"
                  title={item.uploadedBy}
                >
                  {item.uploadedBy}
                </dd>
              </div>
            </dl>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-xs text-muted-foreground">Total records</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 text-center dark:border-green-800 dark:bg-green-950/30">
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {valid}
                </p>
                <p className="text-xs text-muted-foreground">Valid records</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-center dark:border-red-800 dark:bg-red-950/30">
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {invalid}
                </p>
                <p className="text-xs text-muted-foreground">Invalid records</p>
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
                      Row {d.rowNumber}
                      {d.entityKey ? ` · ${d.entityKey}` : ""}
                      {d.field ? ` · ${d.field}` : ""}
                      {d.reason ? ` — ${d.reason}` : d.errorCode ? ` — ${d.errorCode}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
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
      </DialogContent>
    </Dialog>
  )
}
