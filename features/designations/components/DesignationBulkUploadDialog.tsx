"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import { getDesignationImportTemplate, uploadDesignationImport } from "@/features/designations/api/designation.api"

type DesignationBulkUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (files: File[]) => void
  companyUuid: string
}

export function DesignationBulkUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  companyUuid,
}: DesignationBulkUploadDialogProps) {
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload designations"
      description="Upload a CSV or Excel file to import designations in bulk. You can track progress below."
      dropzoneLabel="Drop designation file here"
      dropzoneDescription="CSV or Excel up to 10 MB"
      templateFileName="designation-import-template"
      getTemplate={(format) => getDesignationImportTemplate(companyUuid, format)}
      uploadFn={(file) => uploadDesignationImport(companyUuid, file)}
    />
  )
}
