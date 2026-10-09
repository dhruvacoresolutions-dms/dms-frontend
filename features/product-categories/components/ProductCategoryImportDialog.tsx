"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
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
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload product categories"
      description="Upload a CSV or XLSX file to import product categories in bulk. You can track progress below."
      dropzoneLabel="Drop product categories file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="product-category-import-template"
      getTemplate={(format) =>
        getProductCategoryImportTemplate(companyUuid, format)
      }
      uploadFn={(file) => uploadProductCategoryImport(companyUuid, file)}
    />
  )
}
