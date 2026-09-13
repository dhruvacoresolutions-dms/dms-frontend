"use client"

import { BulkImportDialog, type ImportJobDiagnostic } from "@/components/common/BulkImportDialog"
import { getEmployeeImportTemplate, getEmployeeImportJobStatus, getEmployeeImportFailedRows, getEmployeeImportResultsCsv } from "@/features/employees/api/employee.api"
import type { EmployeeImportRowDetailResponse } from "@/features/employees/api/employee.types"
import { useUploadEmployeeImport } from "@/features/employees/hooks/use-upload-employee-import"
import { useAuthStore } from "@/stores/auth-store"

function toFailedRowDiagnostic(row: EmployeeImportRowDetailResponse): ImportJobDiagnostic | null {
  const failed =
    !!row.errorMessage ||
    !!row.errorCode ||
    (!!row.validationStatus && row.validationStatus !== "VALID")
  if (!failed) return null
  return {
    rowNumber: row.rowNumber,
    entityKey: row.employeeCode ?? undefined,
    errorCode: row.errorCode ?? undefined,
    reason: row.errorMessage ?? undefined,
  }
}

type BulkUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (files: File[]) => void
  /** Optional companyUuid override; defaults to current session company */
  companyUuid?: string
}

export function BulkUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  companyUuid: companyUuidProp,
}: BulkUploadDialogProps) {
  const fallbackCompanyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const companyUuid = companyUuidProp ?? fallbackCompanyUuid
  const uploadMutation = useUploadEmployeeImport(companyUuid)

  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title="Bulk upload employees"
      description="Upload a CSV or XLSX file to import employees in bulk. You can track progress below."
      dropzoneLabel="Drop employee file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="employee-import-template"
      getTemplate={(format) => getEmployeeImportTemplate(companyUuid, format)}
      uploadFn={(file) => uploadMutation.mutateAsync(file)}
      getJobStatus={(jobUuid) => getEmployeeImportJobStatus(companyUuid, jobUuid)}
      getJobFailedRows={async (jobUuid) => {
        const rows = await getEmployeeImportFailedRows(companyUuid, jobUuid)
        return rows.flatMap((row) => {
          const diagnostic = toFailedRowDiagnostic(row)
          return diagnostic ? [diagnostic] : []
        })
      }}
      getJobResults={(jobUuid) => getEmployeeImportResultsCsv(companyUuid, jobUuid)}
    />
  )
}
