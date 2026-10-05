"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { downloadBlob } from "@/lib/file-download"
import {
  getProductCategoryImportTemplate,
  uploadProductCategoryImport,
} from "../api/product-category.api"

type ProductCategoryImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  onUploadComplete?: () => void
}

export function ProductCategoryImportDialog({
  open,
  onOpenChange,
  companyUuid,
  onUploadComplete,
}: ProductCategoryImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [templateLoading, setTemplateLoading] = useState<"csv" | "xlsx" | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleTemplate = async (format: "csv" | "xlsx") => {
    try {
      setTemplateLoading(format)
      const blob = await getProductCategoryImportTemplate(companyUuid, format)
      downloadBlob(blob, `product-category-import-template.${format}`)
      toast.success("Template downloaded")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Template download failed"))
    } finally {
      setTemplateLoading(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Select a file first")
      return
    }
    try {
      setUploading(true)
      const result = await uploadProductCategoryImport(companyUuid, file)
      toast.success(
        `Import complete: ${result.importedRows ?? 0} of ${result.totalRows ?? 0} rows imported`
      )
      setFile(null)
      onUploadComplete?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Import failed"))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk upload product categories</DialogTitle>
          <DialogDescription>
            Download a template, fill it in, then upload the CSV or XLSX file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={templateLoading !== null}
              onClick={() => void handleTemplate("csv")}
            >
              {templateLoading === "csv" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              CSV template
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={templateLoading !== null}
              onClick={() => void handleTemplate("xlsx")}
            >
              {templateLoading === "xlsx" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              XLSX template
            </Button>
          </div>
          <Input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!file || uploading}
              onClick={() => void handleUpload()}
            >
              {uploading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Upload className="mr-2 size-4" />
              )}
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
