"use client"

import * as React from "react"
import {
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  FileTextIcon,
  FileWarningIcon,
  XIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Dropzone } from "@/components/common/Dropzone"
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export type ImportJobDiagnostic = {
  sheet?: string
  rowNumber: number
  entityKey?: string
  field?: string
  rejectedValue?: string
  errorCode?: string
  reason?: string
}

export type ImportJobStatus = {
  status: string
  totalRows: number
  successRows?: number
  failedRows?: number
  diagnostics?: ImportJobDiagnostic[]
}

type UploadItem = {
  file: File
  progress: number
  state: "idle" | "uploading" | "processing" | "error" | "done"
  /** Server-provided error message to show in the Attachment */
  errorMessage?: string
  /** Import job uuid from the upload response */
  jobUuid?: string
  /** Import job status fetched after a successful upload */
  jobStatus?: ImportJobStatus
}

/** Pull the job uuid out of an upload response (`jobUuid` / `importJobUuid` / `publicId`). */
function extractJobUuid(result: unknown): string | undefined {
  if (result == null || typeof result !== "object") return undefined
  const rec = result as Record<string, unknown>
  for (const key of ["jobUuid", "importJobUuid", "publicId", "id", "uuid"]) {
    const v = rec[key]
    if (typeof v === "string" && v.trim()) return v
  }
  return undefined
}

function formatJobStatus(s: ImportJobStatus): string {
  const total = s.totalRows ?? 0
  const ok = s.successRows ?? total - (s.failedRows ?? 0)
  const failed = s.failedRows ?? total - ok
  if (failed > 0 && ok > 0) return `Partial success · ${ok}/${total} rows succeeded · ${failed} failed`
  if (failed > 0) return `Failed · ${failed}/${total} rows failed`
  if (s.status) return `${s.status} · ${ok}/${total} rows succeeded`
  return `${ok}/${total} rows succeeded`
}

function toastUploadResult(fileName: string, status?: ImportJobStatus) {
  if (!status) {
    toast.success(`${fileName} uploaded`)
    return
  }
  const text = `${fileName} uploaded · ${formatJobStatus(status)}`
  const failed = status.failedRows ?? 0
  if (failed <= 0) {
    toast.success(text)
    return
  }
  const ok = status.successRows ?? status.totalRows - failed
  if (ok === 0) toast.error(text)
  else toast.warning(text)
}

export type BulkImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (files: File[]) => void
  /** Dialog title, e.g. "Bulk upload employees" */
  title: string
  /** Dialog description */
  description: string
  /** Dropzone label, e.g. "Drop employee file here" */
  dropzoneLabel?: string
  /** Dropzone description, e.g. "CSV or Excel up to 10 MB" */
  dropzoneDescription?: string
  /** Accepted file extensions, default ".csv,.xlsx" */
  accept?: string
  /** Base filename without extension, e.g. "employee-import-template" */
  templateFileName?: string
  /** Fetch template blob for given format */
  getTemplate: (format: "csv" | "xlsx") => Promise<Blob>
  /** Optional real upload handler; if omitted, dialog simulates upload progress */
  uploadFn?: (file: File) => Promise<unknown>
  /** Optional status fetcher called with the job uuid right after a successful upload */
  getJobStatus?: (jobUuid: string) => Promise<ImportJobStatus>
  /** Optional results fetcher for the "Download Result" button (same job API + /results.csv) */
  getJobResults?: (jobUuid: string) => Promise<Blob>
  /** Max file size bytes, default 10 MB */
  maxSize?: number
}

export function BulkImportDialog({
  open,
  onOpenChange,
  onUploadComplete,
  title,
  description,
  dropzoneLabel = "Drop file here",
  dropzoneDescription = "CSV or XLSX up to 10 MB",
  accept = ".csv,.xlsx",
  templateFileName = "import-template",
  getTemplate,
  uploadFn,
  getJobStatus,
  getJobResults,
  maxSize = 10 * 1024 * 1024,
}: BulkImportDialogProps) {
  const [items, setItems] = React.useState<UploadItem[]>([])
  const [downloading, setDownloading] = React.useState<Record<"csv" | "xlsx", boolean>>({
    csv: false,
    xlsx: false,
  })
  const [downloadingResults, setDownloadingResults] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  /** Tracks whether an upload succeeded in this session, so closing refetches the list */
  const uploadedRef = React.useRef(false)

  const reset = React.useCallback(() => {
    setItems([])
    uploadedRef.current = false
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      const files = items.map((i) => i.file)
      const hadUpload = uploadedRef.current
      reset()
      // refetch the list on every page no matter how the dialog is closed
      if (hadUpload) onUploadComplete?.(files)
    }
    onOpenChange(nextOpen)
  }

  const handleFileSelect = React.useCallback((files: File[]) => {
    if (files.length === 0) return
    // enforce single-file: only first file is considered, store as idle until user clicks Upload
    const file = files[0]
    if (!file) return
    // clear any previous timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setItems([
      {
        file,
        progress: 0,
        state: "idle" as const,
      },
    ])
  }, [])

  const startSimulatedUpload = React.useCallback(() => {
    // transition idle/error -> uploading with simulated progress; expects items already set
    setItems((prev) => prev.map((it) => ({ ...it, state: "uploading" as const, progress: 0 })))

    if (timerRef.current) clearInterval(timerRef.current)

    // idle -> uploading already done, start interval for progress
    timerRef.current = setInterval(() => {
      setItems((prev) => {
        const updated = prev.map((item) => {
          if (item.state === "uploading") {
            const inc = Math.floor(Math.random() * 18) + 8
            const nextProgress = Math.min(100, item.progress + inc)
            if (nextProgress >= 100) {
              if (Math.random() < 0.15) {
                return { ...item, progress: 100, state: "error" as const }
              }
              return { ...item, progress: 100, state: "processing" as const }
            }
            return {
              ...item,
              progress: nextProgress,
              state: "uploading" as const,
            }
          }
          if (item.state === "processing") {
            return item
          }
          return item
        })
        return updated
      })
    }, 280)
  }, [])

  const fetchJobStatus = React.useCallback(
    async (uploadResult: unknown): Promise<{ jobUuid: string; status: ImportJobStatus } | undefined> => {
      if (!getJobStatus) return undefined
      const jobUuid = extractJobUuid(uploadResult)
      if (!jobUuid) return undefined
      try {
        return { jobUuid, status: await getJobStatus(jobUuid) }
      } catch {
        // status fetch must never fail the upload itself
        return undefined
      }
    },
    [getJobStatus]
  )

  const handleDownloadResults = async (jobUuid: string, fileName: string) => {
    if (!getJobResults) return
    try {
      setDownloadingResults(true)
      const blob = await getJobResults(jobUuid)
      const base = fileName.replace(/\.[^.]+$/, "") || fileName
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${base}-results.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("Results downloaded")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to download results"))
    } finally {
      setDownloadingResults(false)
    }
  }

  const startRealUpload = React.useCallback(async () => {
    if (!uploadFn) {
      startSimulatedUpload()
      return
    }
    // upload the single stored file; keep idx 0 for state updates
    const current = items[0]
    if (!current) return
    const file = current.file
    const idx = 0
    // move to uploading then processing
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx
          ? { ...it, progress: 30, state: "uploading" as const, errorMessage: undefined, jobUuid: undefined, jobStatus: undefined }
          : it
      )
    )
    try {
      setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, progress: 60, state: "processing" as const } : it)))
      const uploadResult = await uploadFn(file)
      const job = await fetchJobStatus(uploadResult)
      // keep processing briefly for UX
      await new Promise((r) => setTimeout(r, 600))
      uploadedRef.current = true
      setItems((prev) =>
        prev.map((it, i) =>
          i === idx ? { ...it, progress: 100, state: "done" as const, jobUuid: job?.jobUuid, jobStatus: job?.status } : it
        )
      )
      toastUploadResult(file.name, job?.status)
    } catch (error) {
      const message = getApiErrorMessage(error, `Failed to upload ${file.name}`)
      setItems((prev) =>
        prev.map((it, i) =>
          i === idx
            ? { ...it, progress: 100, state: "error" as const, errorMessage: message }
            : it
        )
      )
      toast.error(message)
    }
  }, [uploadFn, startSimulatedUpload, items, fetchJobStatus])

  // processing -> done after delay (for simulated flow)
  React.useEffect(() => {
    if (uploadFn) return // real flow handles done transition itself
    const processingItems = items.filter((i) => i.state === "processing")
    if (processingItems.length === 0) return
    const t = setTimeout(() => {
      setItems((prev) => prev.map((it) => (it.state === "processing" ? { ...it, state: "done" as const } : it)))
    }, 1200)
    return () => clearTimeout(t)
  }, [items, uploadFn])

  // auto-clear interval when no uploading/processing left (simulated)
  React.useEffect(() => {
    const hasActive = items.some((i) => i.state === "uploading")
    if (!hasActive && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [items])

  const handleCancel = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDownloadTemplate = async (format: "csv" | "xlsx") => {
    try {
      setDownloading((prev) => ({ ...prev, [format]: true }))
      const blob = await getTemplate(format)
      const mime = (blob.type || "").toLowerCase()
      const isCsv = mime.includes("csv") || mime.includes("text/csv") || format === "csv"
      const isExcel =
        mime.includes("spreadsheet") ||
        mime.includes("excel") ||
        mime.includes("openxml") ||
        mime.includes("vnd.ms-excel") ||
        format === "xlsx"

      let ext = ".xlsx"
      if (isCsv && !isExcel) {
        ext = ".csv"
      } else if (isCsv && mime.includes("csv")) {
        ext = ".csv"
      }
      if (format === "csv") ext = ".csv"
      if (format === "xlsx") ext = ".xlsx"
      const filename = `${templateFileName}${ext}`

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(`Template downloaded (${ext === ".csv" ? "CSV" : "Excel"})`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to download template"))
    } finally {
      setDownloading((prev) => ({ ...prev, [format]: false }))
    }
  }

  const isUploading = items.some((i) => i.state === "uploading" || i.state === "processing")
  const isDone = items.length > 0 && items.every((i) => i.state === "done")

  const handleUploadClick = React.useCallback(() => {
    if (isDone) {
      // close handler fires onUploadComplete (list refetch) exactly once
      handleOpenChange(false)
      return
    }
    if (items.length === 0 || isUploading) return
    const hasIdleOrError = items.some((it) => it.state === "idle" || it.state === "error")
    if (!hasIdleOrError) return
    if (uploadFn) {
      void startRealUpload()
    } else {
      startSimulatedUpload()
    }
  }, [items, isDone, isUploading, uploadFn, startRealUpload, startSimulatedUpload, handleOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {items.length === 0 ? (
            <Dropzone
              accept={accept}
              multiple={false}
              maxFiles={1}
              maxSize={maxSize}
              onChange={handleFileSelect}
              label={dropzoneLabel}
              description={dropzoneDescription}
              placeholder=""
            />
          ) : null}

          {items.length > 0 && (
            <div className="flex w-full flex-col gap-2">
              {items.map((item, idx) => {
                const { state, file, progress, errorMessage, jobUuid, jobStatus } = item
                const failedCount = jobStatus?.failedRows ?? 0
                const totalCount = jobStatus?.totalRows ?? 0
                const successCount = jobStatus?.successRows ?? totalCount - failedCount
                const diagnostics = jobStatus?.diagnostics ?? []
                const hasJobStatus = state === "done" && jobStatus != null
                const allFailed = hasJobStatus && failedCount > 0 && successCount === 0
                const showFailures = hasJobStatus && (failedCount > 0 || diagnostics.length > 0)
                // all rows failed -> failed state; mix -> success state with partial text; all ok -> success state
                const displayState = allFailed ? ("error" as const) : state
                const statusText = jobStatus ? formatJobStatus(jobStatus) : `Uploaded · ${formatBytes(file.size)}`
                return (
                  <React.Fragment key={`${file.name}-${idx}`}>
                    <Attachment state={displayState} className="w-full">
                      <AttachmentMedia>
                        {displayState === "idle" && <ClockIcon />}
                        {displayState === "uploading" && <Spinner />}
                        {displayState === "processing" && <FileTextIcon />}
                        {displayState === "error" && <FileWarningIcon />}
                        {displayState === "done" && <CheckIcon />}
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>{file.name}</AttachmentTitle>
                        <AttachmentDescription
                          title={displayState === "error" ? (errorMessage ?? statusText) : undefined}
                          className={displayState === "error" ? "whitespace-normal break-words" : undefined}
                        >
                          {state === "idle" && "Ready to upload"}
                          {state === "uploading" && `Uploading · ${progress}%`}
                          {state === "processing" && "Processing document"}
                          {displayState === "error" && (errorMessage ?? statusText)}
                          {displayState === "done" && statusText}
                        </AttachmentDescription>
                      </AttachmentContent>
                      <AttachmentActions>
                        {displayState === "idle" && (
                          <AttachmentAction aria-label={`Remove ${file.name}`} onClick={() => handleRemove(idx)}>
                            <XIcon />
                          </AttachmentAction>
                        )}
                        {displayState === "uploading" && (
                          <AttachmentAction aria-label="Cancel upload" onClick={() => handleCancel(idx)}>
                            <XIcon />
                          </AttachmentAction>
                        )}
                        {displayState === "processing" && (
                          <AttachmentAction aria-label={`Remove ${file.name}`} onClick={() => handleRemove(idx)}>
                            <XIcon />
                          </AttachmentAction>
                        )}
                        {displayState === "error" && (
                          <AttachmentAction aria-label={`Remove ${file.name}`} onClick={() => handleRemove(idx)}>
                            <XIcon />
                          </AttachmentAction>
                        )}
                        {displayState === "done" && (
                          <AttachmentAction aria-label={`Remove ${file.name}`} onClick={() => handleRemove(idx)}>
                            <XIcon />
                          </AttachmentAction>
                        )}
                      </AttachmentActions>
                    </Attachment>
                    {showFailures && (
                      <div className="flex w-full flex-col gap-2 rounded-xl border border-destructive/30 p-2.5">
                        <p className="text-xs font-medium text-destructive">
                          {failedCount > 0
                            ? `${failedCount} row${failedCount > 1 ? "s" : ""} failed`
                            : "Failed rows"}
                        </p>
                        {diagnostics.length > 0 && (
                          <ul className="flex max-h-32 w-full flex-col gap-1 overflow-y-auto rounded-md bg-destructive/5 p-2 text-xs text-destructive/90">
                            {diagnostics.map((d, i) => (
                              <li key={i} className="break-words">
                                Row {d.rowNumber}
                                {d.entityKey ? ` · ${d.entityKey}` : ""}
                                {d.reason ? ` — ${d.reason}` : d.errorCode ? ` — ${d.errorCode}` : ""}
                              </li>
                            ))}
                          </ul>
                        )}
                        {getJobResults && jobUuid && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadResults(jobUuid, file.name)}
                            disabled={downloadingResults}
                            className="h-7 self-start text-xs"
                          >
                            {downloadingResults ? <Spinner className="size-3.5" /> : <DownloadIcon className="size-3.5" />}
                            Download Result
                          </Button>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-1">
            <Button
              variant="link"
              size="sm"
              onClick={() => handleDownloadTemplate("xlsx")}
              disabled={downloading.xlsx}
              className="h-auto p-0 text-xs"
            >
              {downloading.xlsx ? <Spinner className="size-3.5" /> : <DownloadIcon className="size-3.5" />}
              Download Excel template
            </Button>
            <span className="text-xs text-muted-foreground">·</span>
            <Button
              variant="link"
              size="sm"
              onClick={() => handleDownloadTemplate("csv")}
              disabled={downloading.csv}
              className="h-auto p-0 text-xs"
            >
              {downloading.csv ? <Spinner className="size-3.5" /> : <DownloadIcon className="size-3.5" />}
              Download CSV template
            </Button>
          </div>
        </div>

        <DialogFooter className="-mx-6 -mb-6">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {isDone ? "Close" : "Cancel"}
          </Button>
          <Button disabled={items.length === 0 || isUploading} onClick={handleUploadClick}>
            {isUploading ? "Uploading..." : isDone ? "Done" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
