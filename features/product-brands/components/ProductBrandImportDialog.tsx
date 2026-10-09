"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import {
  getProductBrandImportTemplate,
  uploadProductBrandImport,
} from "../api/product-brand.api"

type ProductBrandImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  onUploadComplete?: () => void
}

export function ProductBrandImportDialog({
  open,
  onOpenChange,
  companyUuid,
  onUploadComplete,
}: ProductBrandImportDialogProps) {
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload product brands"
      description="Upload a CSV or XLSX file to import product brands in bulk. You can track progress below."
      dropzoneLabel="Drop product brands file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="product-brand-import-template"
      getTemplate={(format) =>
        getProductBrandImportTemplate(companyUuid, format)
      }
      uploadFn={(file) => uploadProductBrandImport(companyUuid, file)}
    />
  )
}
