"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import {
  getProductUomImportTemplate,
  uploadProductUomImport,
} from "../api/product-uom.api"

type ProductUomImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  onUploadComplete?: () => void
}

export function ProductUomImportDialog({
  open,
  onOpenChange,
  companyUuid,
  onUploadComplete,
}: ProductUomImportDialogProps) {
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload product UOMs"
      description="Upload a CSV or XLSX file to import product UOMs in bulk. You can track progress below."
      dropzoneLabel="Drop product UOMs file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="product-uom-import-template"
      getTemplate={(format) => getProductUomImportTemplate(companyUuid, format)}
      uploadFn={(file) => uploadProductUomImport(companyUuid, file)}
    />
  )
}
