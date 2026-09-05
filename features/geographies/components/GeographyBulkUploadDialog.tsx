"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import { getGeographyImportTemplate, uploadGeographyImport } from "@/features/geographies/api/geography.api"

type GeographyBulkUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (files: File[]) => void
  companyUuid: string
}

export function GeographyBulkUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  companyUuid,
}: GeographyBulkUploadDialogProps) {
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload geographies"
      description="Upload a CSV or XLSX file to import geographies in bulk. You can track progress below."
      dropzoneLabel="Drop geography file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="geography-import-template"
      getTemplate={(format) => getGeographyImportTemplate(companyUuid, format)}
      uploadFn={(file) => uploadGeographyImport(companyUuid, file)}
    />
  )
}
