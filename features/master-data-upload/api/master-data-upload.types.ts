/** Master data kinds supported by the unified upload page. */
export type MasterDataType =
  | "employee"
  | "department"
  | "designation"
  | "geography"
  | "employee-geography"

/** Query params for the per-type import-history list (folder 15). */
export type ImportHistoryParams = {
  search?: string
  page?: number
  size?: number
}

/**
 * Unified history row. Normalizes the two backend shapes:
 * - standard (department/designation/geography/employee-geography):
 *   `{ jobUuid, importType, status, totalRows, successRows, failedRows,
 *      createdAt, uploadedByUserUuid, originalFilename, attachmentAvailable }`
 * - employee: `{ jobUuid, status, importState, totalRows, validRows,
 *   createdRows, failedRows, createdAt, completedAt, uploadedByUserUuid,
 *   originalFilename, attachmentAvailable }`
 */
export type UnifiedImportHistoryItem = {
  jobUuid: string
  masterType: MasterDataType
  fileName: string
  uploadedAt: string
  /** Backend exposes only the uploader UUID for now (name lookup later). */
  uploadedBy: string
  totalRecords: number
  successRecords: number
  failedRecords: number
  /** Raw backend status, e.g. `COMPLETED`, `FAILED`, `ACCEPTED`. */
  status: string
  attachmentAvailable?: boolean
}

export type ImportJobDiagnostic = {
  sheet?: string
  rowNumber: number
  entityKey?: string
  field?: string
  rejectedValue?: string
  errorCode?: string
  reason?: string
}

/**
 * Unified import-job view used by the wizard result + details dialog.
 * Normalizes standard detail
 * `{ jobUuid, status, totalRows, successRows, failedRows, diagnostics }`
 * and employee detail
 * `{ jobUuid, status, importState, totalRows, validRows, createdRows,
 *    failedRows }` (+ `/diagnostics` fetched separately).
 */
export type UnifiedImportJob = {
  jobUuid: string
  status: string
  totalRows: number
  validRows: number
  invalidRows: number
  diagnostics: ImportJobDiagnostic[]
  /** True for COMPLETED / FAILED / SUCCEEDED (status or importState). */
  terminal: boolean
  failed: boolean
}

const TERMINAL_STATES = new Set(["COMPLETED", "FAILED", "SUCCEEDED"])

export function isTerminalImportStatus(status: string | undefined): boolean {
  if (!status) return false
  return TERMINAL_STATES.has(status.toUpperCase())
}

export function isFailedImportStatus(status: string | undefined): boolean {
  return (status ?? "").toUpperCase() === "FAILED"
}
