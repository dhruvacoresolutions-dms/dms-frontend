"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import {
  getSupplierImportTemplate,
  uploadSupplierImport,
} from "../api/supplier.api"

type SupplierImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  onUploadComplete?: () => void
}

export function SupplierImportDialog({
  open,
  onOpenChange,
  companyUuid,
  onUploadComplete,
}: SupplierImportDialogProps) {
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload suppliers"
      description="Upload a CSV or XLSX file to import suppliers in bulk. Any invalid row rejects the whole file."
      dropzoneLabel="Drop suppliers file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="suppliers-import-template"
      getTemplate={(format) => getSupplierImportTemplate(companyUuid, format)}
      uploadFn={(file) => uploadSupplierImport(companyUuid, file)}
    />
  )
}
