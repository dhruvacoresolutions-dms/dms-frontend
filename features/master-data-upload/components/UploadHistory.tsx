"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  Download,
  Eye,
  FileUp,
  Loader2,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import { SearchInput } from "@/components/common/SearchInput"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { downloadBlob } from "@/lib/file-download"
import { useImportHistory } from "../hooks/use-import-history"
import { ImportJobDetailsDialog } from "./ImportJobDetailsDialog"
import {
  getImportResultsXlsx,
  getMasterTypeConfig,
  getOriginalImportFile,
} from "../api/master-data-upload.api"
import type {
  MasterDataType,
  UnifiedImportHistoryItem,
} from "../api/master-data-upload.types"

const PAGE_SIZE = 10

type Props = {
  companyUuid: string
  type: MasterDataType
}

function formatDateTime(iso: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return format(d, "dd MMM yyyy, hh:mm a")
}

export function UploadHistory({ companyUuid, type }: Props) {
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(0)
  const [selected, setSelected] =
    React.useState<UnifiedImportHistoryItem | null>(null)
  const [downloading, setDownloading] = React.useState<string | null>(null)

  // NOTE: the parent remounts this component (via `key`) whenever the
  // master type changes, so search + pagination reset naturally.

  const config = getMasterTypeConfig(type)
  const { data, isLoading, error, refetch } = useImportHistory(companyUuid, type, {
    search: search || undefined,
    page,
    size: PAGE_SIZE,
  })

  const items = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0
  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE + items.length, totalElements)

  const handleDownload = async (
    item: UnifiedImportHistoryItem,
    kind: "csv" | "xlsx" | "original"
  ) => {
    const key = `${item.jobUuid}:${kind}`
    if (downloading) return
    try {
      setDownloading(key)
      const blob =
        kind === "csv"
          ? await config.getResultsCsv(companyUuid, item.jobUuid)
          : kind === "xlsx"
            ? await getImportResultsXlsx(type, companyUuid, item.jobUuid)
            : await getOriginalImportFile(type, companyUuid, item.jobUuid)
      const base = item.fileName.replace(/\.[^.]+$/, "") || item.fileName
      downloadBlob(
        blob,
        kind === "original" ? item.fileName : `${base}-results.${kind}`
      )
      toast.success("Download started")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Download failed"))
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Upload History</h2>
          <p className="text-sm text-muted-foreground">
            View and track all your master data uploads
          </p>
        </div>
        <SearchInput
          placeholder="Search by file name, type or uploaded by..."
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
          className="sm:max-w-xs"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileUp}
          title={search ? "No uploads match your search" : "No uploads yet"}
          description={
            search
              ? "Try a different search term."
              : `Upload a ${config.label.toLowerCase()} file to see it here.`
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Master Data Type</TableHead>
                  <TableHead>Uploaded On</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead className="text-right">Total Records</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.jobUuid || `${page}-${idx}`}>
                    <TableCell className="text-muted-foreground">
                      {page * PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell
                      className="max-w-55 truncate font-medium"
                      title={item.fileName}
                    >
                      {item.fileName}
                    </TableCell>
                    <TableCell>{config.label}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(item.uploadedAt)}
                    </TableCell>
                    <TableCell
                      className="max-w-40 truncate font-mono text-xs"
                      title={item.uploadedBy}
                    >
                      {item.uploadedBy}
                    </TableCell>
                    <TableCell className="text-right">{item.totalRecords}</TableCell>
                    <TableCell className="text-right font-medium text-green-700 dark:text-green-400">
                      {item.successRecords}
                    </TableCell>
                    <TableCell
                      className={
                        item.failedRecords > 0
                          ? "text-right font-medium text-red-700 dark:text-red-400"
                          : "text-right text-muted-foreground"
                      }
                    >
                      {item.failedRecords}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer">
                          {downloading ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="size-4" />
                          )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-auto min-w-48"
                        >
                          <DropdownMenuItem onClick={() => setSelected(item)}>
                            <Eye className="mr-2 size-4" /> View details
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger disabled={downloading !== null}>
                              <Download className="mr-2 size-4" /> Download
                              results
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem
                                disabled={downloading !== null}
                                onClick={() => void handleDownload(item, "csv")}
                              >
                                <Download className="mr-2 size-4" /> CSV
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={downloading !== null}
                                onClick={() => void handleDownload(item, "xlsx")}
                              >
                                <Download className="mr-2 size-4" /> Excel
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuItem
                            disabled={downloading !== null}
                            onClick={() => void handleDownload(item, "original")}
                          >
                            <Download className="mr-2 size-4" /> Download
                            original file
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {from}–{to} of {totalElements}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <ImportJobDetailsDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        companyUuid={companyUuid}
        type={type}
        item={selected}
      />
    </div>
  )
}
