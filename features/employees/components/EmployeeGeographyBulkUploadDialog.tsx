"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import {
  getEmployeeGeographyImportTemplate,
  uploadEmployeeGeographyImport,
  getEmployeeGeographyImportJob,
  getEmployeeGeographyImportResultsCsv,
} from "@/features/employees/api/employee.api"

type EmployeeGeographyBulkUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (files: File[]) => void
  companyUuid: string
}

export function EmployeeGeographyBulkUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  companyUuid,
}: EmployeeGeographyBulkUploadDialogProps) {
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload employee geographies"
      description="Upload a CSV or XLSX file to assign geographies to employees in bulk. You can track progress below."
      dropzoneLabel="Drop employee geography file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="employee-geography-import-template"
      getTemplate={(format) => getEmployeeGeographyImportTemplate(companyUuid, format)}
      uploadFn={(file) => uploadEmployeeGeographyImport(companyUuid, file)}
      getJobStatus={(jobUuid) => getEmployeeGeographyImportJob(companyUuid, jobUuid)}
      getJobResults={(jobUuid) => getEmployeeGeographyImportResultsCsv(companyUuid, jobUuid)}
    />
  )
}
