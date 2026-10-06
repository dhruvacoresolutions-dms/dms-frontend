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
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
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
  const [size, setSize] = React.useState(10)
  const [selected, setSelected] =
    React.useState<UnifiedImportHistoryItem | null>(null)
  const [downloading, setDownloading] = React.useState<string | null>(null)

  // NOTE: the parent remounts this component (via `key`) whenever the
  // master type changes, so search + pagination reset naturally.

  const config = getMasterTypeConfig(type)
  const { data, isLoading, error, refetch } = useImportHistory(companyUuid, type, {
    search: search || undefined,
    page,
    size,
  })

  const items = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0

  const handleDownload = React.useCallback(
    async (item: UnifiedImportHistoryItem, kind: "csv" | "xlsx" | "original") => {
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
    },
    [companyUuid, config, downloading, type]
  )

  const columns = React.useMemo<DataTableColumn<UnifiedImportHistoryItem>[]>(
    () => [
      {
        id: "index",
        header: "#",
        cell: ({ row }) => page * size + row.index + 1,
      },
      {
        id: "fileName",
        header: "File Name",
        cell: ({ row }) => (
          <span
            className="block max-w-55 truncate font-medium"
            title={row.original.fileName}
          >
            {row.original.fileName}
          </span>
        ),
      },
      {
        id: "masterType",
        header: "Master Data Type",
        cell: () => config.label,
      },
      {
        id: "uploadedOn",
        header: "Uploaded On",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm">
            {formatDateTime(row.original.uploadedAt)}
          </span>
        ),
      },
      {
        id: "uploadedBy",
        header: "Uploaded By",
        cell: ({ row }) => (
          <span
            className="block max-w-40 truncate font-mono text-xs"
            title={row.original.uploadedBy}
          >
            {row.original.uploadedBy}
          </span>
        ),
      },
      {
        id: "total",
        header: "Total Records",
        cell: ({ row }) => (
          <span className="text-right">{row.original.totalRecords}</span>
        ),
      },
      {
        id: "success",
        header: "Success",
        cell: ({ row }) => (
          <span className="text-right font-medium text-green-700 dark:text-green-400">
            {row.original.successRecords}
          </span>
        ),
      },
      {
        id: "failed",
        header: "Failed",
        cell: ({ row }) => (
          <span
            className={
              row.original.failedRecords > 0
                ? "text-right font-medium text-red-700 dark:text-red-400"
                : "text-right text-muted-foreground"
            }
          >
            {row.original.failedRecords}
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
          const item = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                {downloading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="size-4" />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-48">
                <DropdownMenuItem onClick={() => setSelected(item)}>
                  <Eye className="mr-2 size-4" /> View details
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={downloading !== null}>
                    <Download className="mr-2 size-4" /> Download results
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
                  <Download className="mr-2 size-4" /> Download original file
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [config.label, downloading, handleDownload, page, size]
  )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
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
          className="min-w-0 lg:max-w-xs"
        />
      </div>

      <DataTable
        columns={columns}
        data={items}
        getRowId={(item) => item.jobUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: FileUp,
          title: search ? "No uploads match your search" : "No uploads yet",
          description: search
            ? "Try a different search term."
            : `Upload a ${config.label.toLowerCase()} file to see it here.`,
        }}
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
          pageSize: size,
          onPageSizeChange: (s) => { setSize(s); setPage(0) },
          totalElements,
        }}
        wrapperClassName="max-w-full overflow-x-auto"
      />

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
