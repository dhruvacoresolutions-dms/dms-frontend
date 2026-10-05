"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Upload, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { downloadBlob } from "@/lib/file-download"
import {
  getProductImportTemplate,
  uploadProductImport,
  getProductPriceImportTemplate,
  uploadProductPriceImport,
} from "../api/product.api"

type ProductImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  kind: "products" | "prices"
  onUploadComplete?: () => void
}

export function ProductImportDialog({
  open,
  onOpenChange,
  companyUuid,
  kind,
  onUploadComplete,
}: ProductImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState<"template" | "upload" | null>(null)

  const title = kind === "prices" ? "Import Product Prices" : "Import Products"

  const handleTemplate = async (format: "csv" | "xlsx") => {
    try {
      setBusy("template")
      const blob =
        kind === "prices"
          ? await getProductPriceImportTemplate(companyUuid, format)
          : await getProductImportTemplate(companyUuid, format)
      downloadBlob(
        blob,
        kind === "prices"
          ? `product-prices-import-template.${format}`
          : `products-import-template.${format}`
      )
      toast.success("Template downloaded")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Template download failed"))
    } finally {
      setBusy(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    try {
      setBusy("upload")
      if (kind === "prices") {
        await uploadProductPriceImport(companyUuid, file)
      } else {
        await uploadProductImport(companyUuid, file)
      }
      toast.success("Import started")
      setFile(null)
      onOpenChange(false)
      onUploadComplete?.()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Import failed"))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field>
            <FieldLabel>1. Download template</FieldLabel>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() => handleTemplate("csv")}
              >
                {busy === "template" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Download className="mr-2 size-4" />
                )}
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() => handleTemplate("xlsx")}
              >
                {busy === "template" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Download className="mr-2 size-4" />
                )}
                Excel
              </Button>
            </div>
          </Field>
          <Field>
            <FieldLabel>2. Upload filled file</FieldLabel>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!file || busy !== null}
              onClick={handleUpload}
            >
              {busy === "upload" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Upload className="mr-2 size-4" />
              )}
              Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
