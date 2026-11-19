"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import {
  downloadStockAdjustmentImportResults,
  getStockAdjustmentImportTemplate,
  uploadStockAdjustmentImport,
} from "../api/stock-adjustment-import.api"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  onUploadComplete?: () => void
}

/**
 * Stock-adjustment bulk import is company-only. The upload endpoint always
 * returns HTTP 200; a partial import arrives as `success:false` with a
 * `jobUuid` and a `result` block, which is passed straight through so the
 * shared dialog can show row-level diagnostics.
 */
export function StockAdjustmentImportDialog({
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
      title="Bulk upload stock adjustments"
      description="Upload a CSV or XLSX file. Rows are grouped by distributor, godown and document number; valid groups are posted, invalid rows are reported."
      dropzoneLabel="Drop stock adjustments file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="stock-adjustments-import-template"
      getTemplate={(format) =>
        getStockAdjustmentImportTemplate(companyUuid, format)
      }
      uploadFn={async (file) => {
        const payload = await uploadStockAdjustmentImport(companyUuid, file)
        return {
          jobUuid: payload?.jobUuid,
          ...(payload?.result ?? {}),
        }
      }}
      getJobResults={(jobUuid) =>
        downloadStockAdjustmentImportResults(companyUuid, jobUuid, "csv")
      }
    />
  )
}
