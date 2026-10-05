"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { downloadBlob } from "@/lib/file-download"
import {
  getProductAttributeTemplateImportTemplate,
  uploadProductAttributeTemplateImport,
} from "../api/product-attribute-template.api"
import type { ProductAttributeTemplateImportResult } from "../api/product-attribute-template.types"

type ProductAttributeTemplateImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  onImportComplete?: () => void
}

export function ProductAttributeTemplateImportDialog({
  open,
  onOpenChange,
  companyUuid,
  onImportComplete,
}: ProductAttributeTemplateImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] =
    useState<ProductAttributeTemplateImportResult | null>(null)

  const handleClose = (next: boolean) => {
    if (!next) {
      setFile(null)
      setResult(null)
    }
    onOpenChange(next)
  }

  const handleDownloadTemplate = async (format: "csv" | "xlsx") => {
    try {
      setDownloading(format)
      const blob = await getProductAttributeTemplateImportTemplate(
        companyUuid,
        format
      )
      downloadBlob(blob, `product-attribute-templates-import-template.${format}`)
      toast.success("Template downloaded")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to download template"))
    } finally {
      setDownloading(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    try {
      setUploading(true)
      setResult(null)
      const data = await uploadProductAttributeTemplateImport(companyUuid, file)
      setResult(data)
      const failed = data.failedRows ?? 0
      if (failed > 0) {
        toast.warning(
          `Import finished: ${data.successRows ?? data.importedRows ?? 0}/${data.totalRows} rows imported, ${failed} failed`
        )
      } else {
        toast.success(`Import finished: ${data.totalRows} rows imported`)
      }
      onImportComplete?.()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Import failed"))
    } finally {
      setUploading(false)
    }
  }

  const rowErrors =
    (result?.rowErrors?.length ? result.rowErrors : result?.diagnostics) ?? []

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import attribute templates</DialogTitle>
          <DialogDescription>
            Download the template, fill it in, then upload the CSV or XLSX
            file. Only creates are supported — any invalid row rejects the
            whole file.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={downloading !== null}
              onClick={() => handleDownloadTemplate("csv")}
            >
              {downloading === "csv" ? (
                <Spinner className="size-4" />
              ) : (
                <Download className="size-4" />
              )}
              CSV template
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={downloading !== null}
              onClick={() => handleDownloadTemplate("xlsx")}
            >
              {downloading === "xlsx" ? (
                <Spinner className="size-4" />
              ) : (
                <Download className="size-4" />
              )}
              Excel template
            </Button>
          </div>
          <Input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {result && (
            <div className="rounded-md border p-3 text-sm">
              <p>
                Total: {result.totalRows} · Imported:{" "}
                {result.successRows ?? result.importedRows ?? 0} · Failed:{" "}
                {result.failedRows ?? 0}
                {result.status ? ` · ${result.status}` : ""}
              </p>
              {rowErrors.length > 0 && (
                <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-destructive">
                  {rowErrors.map((r, i) => (
                    <li key={i}>
                      Row {String(r.row ?? r.rowNumber ?? "?")}
                      {r.field ? ` · ${String(r.field)}` : ""}
                      {r.message || r.reason
                        ? ` — ${String(r.message ?? r.reason)}`
                        : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              Close
            </Button>
            <Button
              disabled={!file || uploading}
              onClick={handleUpload}
            >
              {uploading ? (
                <Spinner className="size-4" />
              ) : (
                <Upload className="size-4" />
              )}
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
