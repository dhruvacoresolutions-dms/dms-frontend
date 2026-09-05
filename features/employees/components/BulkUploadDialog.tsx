"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import { getEmployeeImportTemplate, uploadEmployeeImport } from "@/features/employees/api/employee.api"
import { useAuthStore } from "@/stores/auth-store"

type BulkUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (files: File[]) => void
}

export function BulkUploadDialog({ open, onOpenChange, onUploadComplete }: BulkUploadDialogProps) {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload employees"
      description="Upload a CSV or Excel file to import employees in bulk. You can track progress below."
      dropzoneLabel="Drop employee file here"
      dropzoneDescription="CSV or Excel up to 10 MB"
      templateFileName="employee-import-template"
      getTemplate={(format) => getEmployeeImportTemplate(companyUuid, format)}
      uploadFn={(file) => uploadEmployeeImport(companyUuid, file)}
    />
  )
}
