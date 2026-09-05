"use client"

import * as React from "react"
import { Upload, FileText, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function isFileAccepted(file: File, accept?: string): boolean {
  if (!accept) return true
  const acceptList = accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const fileName = file.name.toLowerCase()
  const mime = file.type.toLowerCase()

  return acceptList.some((a) => {
    if (a.startsWith(".")) {
      return fileName.endsWith(a)
    }
    if (a.endsWith("/*")) {
      const prefix = a.slice(0, -2)
      return mime.startsWith(prefix + "/")
    }
    return mime === a
  })
}

export type DropzoneProps = {
  /** Controlled files */
  value?: File | File[] | null
  /** Default files for uncontrolled */
  defaultValue?: File | File[] | null
  /** Called with validated files */
  onChange?: (files: File[]) => void
  /** Called when a single file is selected (alias for onChange with 1 file) */
  onFileSelect?: (file: File | null) => void
  accept?: string // e.g. ".csv,.xlsx" or "image/*,application/pdf"
  multiple?: boolean
  maxSize?: number // bytes
  maxFiles?: number
  disabled?: boolean
  label?: string
  description?: string
  hint?: string
  error?: string
  className?: string
  /** Placeholder when no file */
  placeholder?: string
}

export function Dropzone({
  value,
  defaultValue,
  onChange,
  onFileSelect,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  disabled = false,
  label = "Upload file",
  description = "Drag and drop files here, or click to browse",
  hint,
  error,
  className,
  placeholder = "No file selected",
}: DropzoneProps) {
  const isControlled = value !== undefined
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = React.useState(false)
  const [internalFiles, setInternalFiles] = React.useState<File[]>(() => {
    const init = value ?? defaultValue
    if (!init) return []
    return Array.isArray(init) ? init : [init]
  })
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  )

  const files = React.useMemo(() => {
    if (isControlled) {
      if (!value) return []
      return Array.isArray(value) ? value : [value]
    }
    return internalFiles
  }, [isControlled, value, internalFiles])

  const displayError = error ?? validationError

  const emit = React.useCallback(
    (nextFiles: File[]) => {
      if (!isControlled) setInternalFiles(nextFiles)
      onChange?.(nextFiles)
      if (multiple) {
        onFileSelect?.(nextFiles[0] ?? null)
      } else {
        onFileSelect?.(nextFiles[0] ?? null)
      }
    },
    [isControlled, onChange, onFileSelect, multiple]
  )

  const validateAndAdd = React.useCallback(
    (incoming: FileList | File[]) => {
      setValidationError(null)
      const list = Array.from(incoming)
      if (list.length === 0) return

      let next: File[] = []

      // filter by accept
      const rejectedByType: File[] = []
      const accepted: File[] = []
      for (const f of list) {
        if (!isFileAccepted(f, accept)) rejectedByType.push(f)
        else accepted.push(f)
      }
      if (rejectedByType.length) {
        setValidationError(
          `File type not accepted: ${rejectedByType.map((f) => f.name).join(", ")}`
        )
        // still continue with accepted files, or return early if none accepted
        if (accepted.length === 0) return
      }

      // filter by maxSize
      if (maxSize) {
        const tooLarge = accepted.filter((f) => f.size > maxSize)
        if (tooLarge.length) {
          setValidationError(
            `${tooLarge.map((f) => f.name).join(", ")} exceeds ${formatBytes(maxSize)}`
          )
          // remove too large
          const ok = accepted.filter((f) => f.size <= maxSize)
          if (ok.length === 0) return
          next = ok
        } else {
          next = accepted
        }
      } else {
        next = accepted
      }

      // handle multiple / maxFiles
      if (!multiple) {
        next = next.slice(0, 1)
        emit(next)
        return
      }

      const limit = maxFiles ?? Infinity
      const combined = [...files, ...next]
      if (combined.length > limit) {
        setValidationError(`You can only upload up to ${limit} file(s)`)
        emit(combined.slice(0, limit))
        return
      }

      emit(combined)
    },
    [accept, maxSize, multiple, maxFiles, files, emit]
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) validateAndAdd(e.target.files)
    // reset input so same file can be selected again
    e.target.value = ""
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (disabled) return
    if (e.dataTransfer.files) validateAndAdd(e.dataTransfer.files)
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragActive(true)
  }

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index)
    setValidationError(null)
    emit(next)
  }

  const clearAll = () => {
    setValidationError(null)
    emit([])
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Drop area */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card px-6 py-8 text-center transition-colors",
          "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
          disabled && "pointer-events-none opacity-50",
          isDragActive
            ? "border-primary bg-primary/5"
            : displayError
              ? "border-destructive/50 bg-destructive/5"
              : "border-input",
          files.length > 0 && "py-6"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={onInputChange}
          tabIndex={-1}
        />

        <div
          className={cn(
            "mb-3 flex size-10 items-center justify-center rounded-full border bg-muted",
            isDragActive && "border-primary bg-primary/10",
            displayError && "border-destructive/30 bg-destructive/10"
          )}
        >
          <Upload
            className={cn(
              "size-5 text-muted-foreground",
              isDragActive && "text-primary",
              displayError && "text-destructive"
            )}
          />
        </div>

        <p className="text-sm font-medium">
          {isDragActive ? "Drop files here" : label}
        </p>
        <p className="mt-1 max-w-lg text-xs text-balance text-muted-foreground">
          {description}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        {accept && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Accepted: {accept}
            {maxSize ? ` • Max ${formatBytes(maxSize)}` : ""}
            {multiple && maxFiles ? ` • Up to ${maxFiles} files` : ""}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="pointer-events-none mt-4"
          tabIndex={-1}
        >
          Browse files
        </Button>
      </div>

      {/* Selected files */}
      {files.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
            {files.length > 1 && !disabled && (
              <Button
                variant="ghost"
                size="xs"
                onClick={clearAll}
                className="h-6"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{placeholder}</p>
      )}

      {displayError && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          {displayError}
        </p>
      )}
    </div>
  )
}
