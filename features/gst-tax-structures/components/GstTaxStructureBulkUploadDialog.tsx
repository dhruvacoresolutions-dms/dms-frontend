"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import { getGstTaxStructureImportTemplate, uploadGstTaxStructureImport } from "@/features/gst-tax-structures/api/gst-tax-structures.api"

type GstTaxStructureBulkUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (files: File[]) => void
  companyUuid: string
}

export function GstTaxStructureBulkUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  companyUuid,
}: GstTaxStructureBulkUploadDialogProps) {
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload GST tax structures"
      description="Upload a CSV or XLSX file to import GST tax structures in bulk. You can track progress below."
      dropzoneLabel="Drop GST tax structure file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="gst-tax-structure-import-template"
      getTemplate={(format) => getGstTaxStructureImportTemplate(companyUuid, format)}
      uploadFn={(file) => uploadGstTaxStructureImport(companyUuid, file)}
    />
  )
}
