"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import { getDepartmentImportTemplate, uploadDepartmentImport, getDepartmentImportJob, getDepartmentImportResultsCsv } from "@/features/departments/api/department.api"

type DepartmentBulkUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (files: File[]) => void
  companyUuid: string
}

export function DepartmentBulkUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  companyUuid,
}: DepartmentBulkUploadDialogProps) {
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload departments"
      description="Upload a CSV or XLSX file to import departments in bulk. You can track progress below."
      dropzoneLabel="Drop department file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="department-import-template"
      getTemplate={(format) => getDepartmentImportTemplate(companyUuid, format)}
      uploadFn={(file) => uploadDepartmentImport(companyUuid, file)}
      getJobStatus={(jobUuid) => getDepartmentImportJob(companyUuid, jobUuid)}
      getJobResults={(jobUuid) => getDepartmentImportResultsCsv(companyUuid, jobUuid)}
    />
  )
}
