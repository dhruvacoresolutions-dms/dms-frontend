"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import { getGstHsnImportTemplate, uploadGstHsnImport } from "@/features/gst-hsn/api/gst-hsn.api"

type GstHsnBulkUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (files: File[]) => void
  companyUuid: string
}

export function GstHsnBulkUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  companyUuid,
}: GstHsnBulkUploadDialogProps) {
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload GST HSN"
      description="Upload a CSV or XLSX file to import GST HSN entries in bulk. You can track progress below."
      dropzoneLabel="Drop GST HSN file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="gst-hsn-import-template"
      getTemplate={(format) => getGstHsnImportTemplate(companyUuid, format)}
      uploadFn={(file) => uploadGstHsnImport(companyUuid, file)}
    />
  )
}
