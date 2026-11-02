"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import {
  getDistributorStatusImportTemplate,
  uploadDistributorStatusImport,
} from "../api/distributor.api"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  onUploadComplete?: () => void
}

export function DistributorStatusImportDialog({
  open,
  onOpenChange,
  companyUuid,
  onUploadComplete,
}: Props) {
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk status import"
      description="Upload a CSV or XLSX file to activate or deactivate distributors in bulk."
      dropzoneLabel="Drop status file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="distributor-status-import-template"
      getTemplate={(format) =>
        format === "xlsx"
          ? getDistributorStatusImportTemplate(companyUuid)
          : Promise.reject(new Error("Only an Excel template is provided"))}
      uploadFn={(file) => uploadDistributorStatusImport(companyUuid, file)}
    />
  )
}
