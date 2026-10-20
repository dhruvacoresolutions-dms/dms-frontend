"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import {
  getCustomerPincodeImportTemplate,
  uploadCustomerPincodeImport,
} from "../api/customer.api"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  onUploadComplete?: () => void
}

export function CustomerPincodeImportDialog({
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
      title="Bulk upload pincode mappings"
      description="Upload a CSV or XLSX file with pincode → territory mappings. The import is all-or-nothing: any invalid row rejects the whole file."
      dropzoneLabel="Drop pincode mapping file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="customer-pincode-mappings-template"
      getTemplate={(format) => getCustomerPincodeImportTemplate(companyUuid, format)}
      uploadFn={(file) => uploadCustomerPincodeImport(companyUuid, file)}
    />
  )
}
