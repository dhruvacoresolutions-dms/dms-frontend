import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type { PageResponse } from "@/features/companies/api/company.types"
import { PERMISSIONS } from "@/lib/permissions"
import {
  getEmployeeImportTemplate,
  uploadEmployeeImport,
  getEmployeeImportJob,
  getEmployeeImportResultsCsv,
  getEmployeeGeographyImportTemplate,
  uploadEmployeeGeographyImport,
  getEmployeeGeographyImportJob,
  getEmployeeGeographyImportResultsCsv,
} from "@/features/employees/api/employee.api"
import {
  getDepartmentImportTemplate,
  uploadDepartmentImport,
  getDepartmentImportJob,
  getDepartmentImportResultsCsv,
} from "@/features/departments/api/department.api"
import {
  getDesignationImportTemplate,
  uploadDesignationImport,
  getDesignationImportJob,
  getDesignationImportResultsCsv,
} from "@/features/designations/api/designation.api"
import {
  getGeographyImportTemplate,
  uploadGeographyImport,
  getGeographyImportJob,
  getGeographyImportResultsCsv,
} from "@/features/geographies/api/geography.api"
import type {
  ImportHistoryParams,
  MasterDataType,
  UnifiedImportHistoryItem,
  UnifiedImportJob,
  ImportJobDiagnostic,
} from "./master-data-upload.types"
import {
  isFailedImportStatus,
  isTerminalImportStatus,
} from "./master-data-upload.types"

// ── Helpers ────────────────────────────────────────────────────────────────

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

/** Pull the job uuid out of an upload response (`jobUuid` / `importJobUuid` / `publicId`). */
export function extractImportJobUuid(result: unknown): string | undefined {
  if (result == null || typeof result !== "object") return undefined
  const rec = result as Record<string, unknown>
  for (const key of ["jobUuid", "importJobUuid", "publicId", "id", "uuid"]) {
    const v = rec[key]
    if (typeof v === "string" && v.trim()) return v
  }
  return undefined
}

function toNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback
}

function toString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback
}

// ── Import history ─────────────────────────────────────────────────────────
// Folder 15 documents `/employees/imports` and `/employee-geography/imports`,
// but those paths collide with the existing `GET …/employees/{employeeUuid}`
// detail route and the live backend rejects them (400). History therefore
// uses the same bases as the upload/job endpoints (folder 12), which also
// keeps each type's list/detail/downloads on one consistent base.

const historyBaseUrl: Record<MasterDataType, (companyUuid: string) => string> = {
  employee: (c) =>
    `/api/v1/companies/${resolveCompanyUuid(c)}/employee-imports`,
  department: (c) =>
    `/api/v1/companies/${resolveCompanyUuid(c)}/departments/imports`,
  designation: (c) =>
    `/api/v1/companies/${resolveCompanyUuid(c)}/designations/imports`,
  geography: (c) =>
    `/api/v1/companies/${resolveCompanyUuid(c)}/geographies/imports`,
  "employee-geography": (c) =>
    `/api/v1/companies/${resolveCompanyUuid(c)}/employee-geography-imports`,
}

/** Loose backend row: standard shape or employee shape (see types). */
type RawHistoryRow = Record<string, unknown>

function normalizeHistoryRow(
  type: MasterDataType,
  raw: RawHistoryRow
): UnifiedImportHistoryItem {
  const total = toNumber(raw.totalRows)
  const failed = toNumber(raw.failedRows ?? raw.failureCount)
  const success = toNumber(
    raw.successRows ??
      raw.validRows ??
      raw.successCount ??
      raw.createdRows ??
      Math.max(total - failed, 0)
  )
  return {
    jobUuid: toString(raw.jobUuid ?? raw.importJobUuid ?? raw.publicId),
    masterType: type,
    fileName: toString(raw.originalFilename ?? raw.fileName, "—"),
    uploadedAt: toString(raw.createdAt ?? raw.uploadedAt),
    uploadedBy: toString(raw.uploadedByUserUuid ?? raw.uploadedBy, "—"),
    totalRecords: total,
    successRecords: success,
    failedRecords: failed,
    status: toString(raw.status, "PENDING"),
    attachmentAvailable:
      typeof raw.attachmentAvailable === "boolean"
        ? raw.attachmentAvailable
        : undefined,
  }
}

export async function listImportHistory(
  type: MasterDataType,
  companyUuid: string,
  params?: ImportHistoryParams
): Promise<PageResponse<UnifiedImportHistoryItem>> {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<RawHistoryRow>>
  >(historyBaseUrl[type](companyUuid), {
    // `search` is sent for forward-compatibility; the backend currently
    // documents only page/size and ignores unknown params.
    params: {
      search: params?.search || undefined,
      page: params?.page ?? 0,
      size: params?.size ?? 10,
    },
    headers: { "X-Company-Context": resolved },
  })
  const page = data.data
  return {
    ...page,
    content: (page.content ?? []).map((row) => normalizeHistoryRow(type, row)),
  }
}

// ── Job detail / results downloads (Postman folder 12) ─────────────────────
// Detail + download endpoints keep the per-module bases:
//   employee:             `/employee-imports/{jobUuid}`
//   department:           `/departments/imports/{jobUuid}`
//   designation:          `/designations/imports/{jobUuid}`
//   geography:            `/geographies/imports/{jobUuid}`
//   employee-geography:   `/employee-geography-imports/{jobUuid}`

const detailBaseUrl: Record<MasterDataType, (companyUuid: string) => string> = {
  employee: (c) =>
    `/api/v1/companies/${resolveCompanyUuid(c)}/employee-imports`,
  department: (c) =>
    `/api/v1/companies/${resolveCompanyUuid(c)}/departments/imports`,
  designation: (c) =>
    `/api/v1/companies/${resolveCompanyUuid(c)}/designations/imports`,
  geography: (c) =>
    `/api/v1/companies/${resolveCompanyUuid(c)}/geographies/imports`,
  "employee-geography": (c) =>
    `/api/v1/companies/${resolveCompanyUuid(c)}/employee-geography-imports`,
}

function normalizeDiagnostics(raw: unknown): ImportJobDiagnostic[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((d): d is Record<string, unknown> => typeof d === "object" && d !== null)
    .map((d) => ({
      sheet: typeof d.sheet === "string" ? d.sheet : undefined,
      rowNumber: toNumber(d.rowNumber),
      entityKey: typeof d.entityKey === "string" ? d.entityKey : undefined,
      field: typeof d.field === "string" ? d.field : undefined,
      rejectedValue:
        typeof d.rejectedValue === "string" ? d.rejectedValue : undefined,
      errorCode: typeof d.errorCode === "string" ? d.errorCode : undefined,
      reason:
        typeof d.reason === "string"
          ? d.reason
          : typeof d.errorMessage === "string"
            ? d.errorMessage
            : undefined,
    }))
}

function normalizeJobDetail(
  jobUuid: string,
  raw: Record<string, unknown>,
  extraDiagnostics: ImportJobDiagnostic[] = []
): UnifiedImportJob {
  const status = toString(raw.status, "PENDING")
  const importState =
    typeof raw.importState === "string" ? raw.importState : undefined
  const total = toNumber(raw.totalRows)
  const invalid = toNumber(raw.failedRows ?? raw.failureCount)
  const valid = toNumber(
    raw.successRows ??
      raw.validRows ??
      raw.successCount ??
      raw.createdRows ??
      Math.max(total - invalid, 0)
  )
  const embedded = normalizeDiagnostics(raw.diagnostics)
  return {
    jobUuid: toString(raw.jobUuid ?? raw.importJobUuid ?? raw.publicId, jobUuid),
    status,
    totalRows: total,
    validRows: valid,
    invalidRows: invalid,
    diagnostics: embedded.length > 0 ? embedded : extraDiagnostics,
    terminal: isTerminalImportStatus(status) || isTerminalImportStatus(importState),
    failed: isFailedImportStatus(status) || isFailedImportStatus(importState),
  }
}

async function getEmployeeDiagnostics(
  companyUuid: string,
  jobUuid: string
): Promise<ImportJobDiagnostic[]> {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<unknown>>(
    `${detailBaseUrl.employee(companyUuid)}/${jobUuid}/diagnostics`,
    { headers: { "X-Company-Context": resolved } }
  )
  return normalizeDiagnostics(data.data)
}

/**
 * Unified job fetch used by the wizard (poll) and the details dialog.
 * Employee row errors live behind `/diagnostics`, fetched best-effort only
 * when the job reports failures (must never fail the status itself).
 */
export async function getUnifiedImportJob(
  type: MasterDataType,
  companyUuid: string,
  jobUuid: string
): Promise<UnifiedImportJob> {
  const rawGetters: Record<MasterDataType, () => Promise<unknown>> = {
    employee: () => getEmployeeImportJob(companyUuid, jobUuid),
    department: () => getDepartmentImportJob(companyUuid, jobUuid),
    designation: () => getDesignationImportJob(companyUuid, jobUuid),
    geography: () => getGeographyImportJob(companyUuid, jobUuid),
    "employee-geography": () => getEmployeeGeographyImportJob(companyUuid, jobUuid),
  }
  const raw = (await rawGetters[type]()) as Record<string, unknown>
  const failedCount = toNumber(raw.failedRows ?? raw.failureCount)
  let extra: ImportJobDiagnostic[] = []
  if (type === "employee" && failedCount > 0) {
    try {
      extra = await getEmployeeDiagnostics(companyUuid, jobUuid)
    } catch {
      extra = []
    }
  }
  return normalizeJobDetail(jobUuid, raw, extra)
}

async function downloadImportBlob(
  type: MasterDataType,
  companyUuid: string,
  jobUuid: string,
  suffix: "results.csv" | "results.xlsx" | "original"
): Promise<Blob> {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${detailBaseUrl[type](companyUuid)}/${jobUuid}/${suffix}`,
    { headers: { "X-Company-Context": resolved }, responseType: "blob" }
  )
  return data
}

export async function getImportResultsXlsx(
  type: MasterDataType,
  companyUuid: string,
  jobUuid: string
): Promise<Blob> {
  return downloadImportBlob(type, companyUuid, jobUuid, "results.xlsx")
}

export async function getOriginalImportFile(
  type: MasterDataType,
  companyUuid: string,
  jobUuid: string
): Promise<Blob> {
  return downloadImportBlob(type, companyUuid, jobUuid, "original")
}

// ── Master-type registry ───────────────────────────────────────────────────
// No backend endpoint lists the available master types, so the five import
// families are registered here, wired to the existing per-module services.

export type UploadFormat = "csv" | "xlsx"

export type MasterTypeConfig = {
  type: MasterDataType
  label: string
  /** Permission code guarding upload + template download for this type. */
  permission: string
  templateFileName: string
  getTemplate: (companyUuid: string, format: UploadFormat) => Promise<Blob>
  upload: (companyUuid: string, file: File) => Promise<unknown>
  getResultsCsv: (companyUuid: string, jobUuid: string) => Promise<Blob>
}

export const MASTER_DATA_TYPES: MasterTypeConfig[] = [
  {
    type: "employee",
    label: "Employee",
    permission: PERMISSIONS.EMPLOYEE.IMPORT,
    templateFileName: "employee-import-template",
    getTemplate: getEmployeeImportTemplate,
    upload: uploadEmployeeImport,
    getResultsCsv: getEmployeeImportResultsCsv,
  },
  {
    type: "department",
    label: "Department",
    permission: PERMISSIONS.DEPARTMENT.IMPORT,
    templateFileName: "department-import-template",
    getTemplate: getDepartmentImportTemplate,
    upload: uploadDepartmentImport,
    getResultsCsv: getDepartmentImportResultsCsv,
  },
  {
    type: "designation",
    label: "Designation",
    permission: PERMISSIONS.DESIGNATION.IMPORT,
    templateFileName: "designation-import-template",
    getTemplate: getDesignationImportTemplate,
    upload: uploadDesignationImport,
    getResultsCsv: getDesignationImportResultsCsv,
  },
  {
    type: "geography",
    label: "Geography",
    permission: PERMISSIONS.GEOGRAPHY.IMPORT,
    templateFileName: "geography-import-template",
    getTemplate: getGeographyImportTemplate,
    upload: uploadGeographyImport,
    getResultsCsv: getGeographyImportResultsCsv,
  },
  {
    type: "employee-geography",
    label: "Employee Geography",
    permission: PERMISSIONS.EMPLOYEE.GEOGRAPHY_IMPORT,
    templateFileName: "employee-geography-import-template",
    getTemplate: getEmployeeGeographyImportTemplate,
    upload: uploadEmployeeGeographyImport,
    getResultsCsv: getEmployeeGeographyImportResultsCsv,
  },
]

export function getMasterTypeConfig(type: MasterDataType): MasterTypeConfig {
  const found = MASTER_DATA_TYPES.find((t) => t.type === type)
  if (!found) throw new Error(`Unknown master data type: ${type}`)
  return found
}

/** All IMPORT codes guarding this module (sidebar + page gate, ANY passes). */
export const MASTER_DATA_UPLOAD_PERMISSIONS = MASTER_DATA_TYPES.map(
  (t) => t.permission
)
