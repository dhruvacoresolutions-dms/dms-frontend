"use client"

import * as React from "react"
import {
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  FileTextIcon,
  FileWarningIcon,
  RefreshCwIcon,
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

type UploadItem = {
  file: File
  progress: number
  state: "idle" | "uploading" | "processing" | "error" | "done"
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
  /** Accepted file extensions, default ".csv,.xlsx,.xls" */
  accept?: string
  /** Base filename without extension, e.g. "employee-import-template" */
  templateFileName?: string
  /** Fetch template blob for given format */
  getTemplate: (format: "csv" | "xlsx") => Promise<Blob>
  /** Optional real upload handler; if omitted, dialog simulates upload progress */
  uploadFn?: (file: File) => Promise<unknown>
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
  dropzoneDescription = "CSV or Excel up to 10 MB",
  accept = ".csv,.xlsx,.xls",
  templateFileName = "import-template",
  getTemplate,
  uploadFn,
  maxSize = 10 * 1024 * 1024,
}: BulkImportDialogProps) {
  const [items, setItems] = React.useState<UploadItem[]>([])
  const [downloading, setDownloading] = React.useState<Record<"csv" | "xlsx", boolean>>({
    csv: false,
    xlsx: false,
  })
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const reset = React.useCallback(() => {
    setItems([])
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const startSimulatedUpload = React.useCallback((files: File[]) => {
    if (files.length === 0) return
    const next: UploadItem[] = files.map((f) => ({
      file: f,
      progress: 0,
      state: "idle" as const,
    }))
    setItems(next)

    if (timerRef.current) clearInterval(timerRef.current)

    setTimeout(() => {
      setItems((prev) => prev.map((it) => ({ ...it, state: "uploading" as const })))

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
    }, 600)
  }, [])

  const startRealUpload = React.useCallback(
    async (files: File[]) => {
      if (!uploadFn) {
        startSimulatedUpload(files)
        return
      }
      const next: UploadItem[] = files.map((f) => ({
        file: f,
        progress: 30,
        state: "uploading" as const,
      }))
      setItems(next)
      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx]
        try {
          setItems((prev) =>
            prev.map((it, i) => (i === idx ? { ...it, progress: 60, state: "processing" as const } : it))
          )
          await uploadFn(file)
          // keep processing briefly for UX
          await new Promise((r) => setTimeout(r, 600))
          setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, progress: 100, state: "done" as const } : it)))
          toast.success(`${file.name} uploaded`)
        } catch (error) {
          setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, progress: 100, state: "error" as const } : it)))
          toast.error(getApiErrorMessage(error, `Failed to upload ${file.name}`))
        }
      }
    },
    [uploadFn, startSimulatedUpload]
  )

  const startUpload = (files: File[]) => {
    if (uploadFn) {
      void startRealUpload(files)
    } else {
      startSimulatedUpload(files)
    }
  }

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

  const handleRetry = (index: number) => {
    const item = items[index]
    if (!item) return
    if (uploadFn) {
      setItems((prev) => prev.filter((_, i) => i !== index))
      void startRealUpload([item.file])
      return
    }
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, state: "uploading" as const, progress: 0 } : it)))
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Dropzone
            accept={accept}
            multiple={false}
            maxSize={maxSize}
            onChange={startUpload}
            label={dropzoneLabel}
            description={dropzoneDescription}
          />

          {items.length > 0 && (
            <div className="flex w-full flex-col gap-2">
              {items.map((item, idx) => {
                const { state, file, progress } = item
                return (
                  <Attachment key={`${file.name}-${idx}`} state={state} className="w-full">
                    <AttachmentMedia>
                      {state === "idle" && <ClockIcon />}
                      {state === "uploading" && <Spinner />}
                      {state === "processing" && <FileTextIcon />}
                      {state === "error" && <FileWarningIcon />}
                      {state === "done" && <CheckIcon />}
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{file.name}</AttachmentTitle>
                      <AttachmentDescription>
                        {state === "idle" && "Ready to upload"}
                        {state === "uploading" && `Uploading · ${progress}%`}
                        {state === "processing" && "Processing document"}
                        {state === "error" && "Upload failed. Try again."}
                        {state === "done" && `Uploaded · ${formatBytes(file.size)}`}
                      </AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      {state === "idle" && (
                        <AttachmentAction aria-label={`Remove ${file.name}`} onClick={() => handleRemove(idx)}>
                          <XIcon />
                        </AttachmentAction>
                      )}
                      {state === "uploading" && (
                        <AttachmentAction aria-label="Cancel upload" onClick={() => handleCancel(idx)}>
                          <XIcon />
                        </AttachmentAction>
                      )}
                      {state === "processing" && (
                        <AttachmentAction aria-label={`Remove ${file.name}`} onClick={() => handleRemove(idx)}>
                          <XIcon />
                        </AttachmentAction>
                      )}
                      {state === "error" && (
                        <>
                          <AttachmentAction aria-label="Retry upload" onClick={() => handleRetry(idx)}>
                            <RefreshCwIcon />
                          </AttachmentAction>
                          <AttachmentAction aria-label={`Remove ${file.name}`} onClick={() => handleRemove(idx)}>
                            <XIcon />
                          </AttachmentAction>
                        </>
                      )}
                      {state === "done" && (
                        <AttachmentAction aria-label={`Remove ${file.name}`} onClick={() => handleRemove(idx)}>
                          <XIcon />
                        </AttachmentAction>
                      )}
                    </AttachmentActions>
                  </Attachment>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {isDone ? "Close" : "Cancel"}
          </Button>
          <Button
            disabled={items.length === 0 || isUploading}
            onClick={() => {
              if (isDone) {
                onUploadComplete?.(items.map((i) => i.file))
                handleOpenChange(false)
              }
            }}
          >
            {isUploading ? "Uploading..." : isDone ? "Done" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
