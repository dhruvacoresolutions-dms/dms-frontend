"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import {
  getGstTaxCodeImportTemplate,
  uploadGstTaxCodeImport,
} from "../api/gst-tax-code.api"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (files: File[]) => void
  companyUuid: string
}

export function GstTaxCodeImportDialog({
  open,
  onOpenChange,
  onUploadComplete,
  companyUuid,
}: Props) {
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload GST tax codes"
      description="Upload a CSV or XLSX file to import GST tax codes in bulk. Only creates are supported; any invalid row rejects the whole file."
      dropzoneLabel="Drop GST tax code file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="gst-tax-codes-import-template"
      getTemplate={(format) => getGstTaxCodeImportTemplate(companyUuid, format)}
      uploadFn={(file) => uploadGstTaxCodeImport(companyUuid, file)}
    />
  )
}
