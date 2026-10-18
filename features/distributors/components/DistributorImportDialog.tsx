"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import {
  getDistributorImportTemplate,
  uploadDistributorImport,
} from "../api/distributor.api"

type DistributorImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  onUploadComplete?: () => void
}

export function DistributorImportDialog({
  open,
  onOpenChange,
  companyUuid,
  onUploadComplete,
}: DistributorImportDialogProps) {
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload distributors"
      description="Upload a CSV or XLSX file to import distributors in bulk. Any invalid row rejects the whole file."
      dropzoneLabel="Drop distributors file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="distributors-import-template"
      getTemplate={(format) => getDistributorImportTemplate(companyUuid, format)}
      uploadFn={(file) => uploadDistributorImport(companyUuid, file)}
    />
  )
}
