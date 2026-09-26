import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  EmployeeResponse,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  UpdateEmployeeStatusRequest,
  EmployeeListParams,
  EmployeeGeographyResponse,
  EmployeeGeographyListParams,
  AssignEmployeeGeographyRequest,
  EmployeeLoginStatusResponse,
  EnableEmployeeLoginRequest,
  EnableEmployeeLoginResponse,
  RawEnableEmployeeLoginResponse,
  DisableEmployeeLoginResponse,
  BulkEnableEmployeeLoginRequest,
  BulkDisableEmployeeLoginRequest,
  BulkLoginResultEntry,
  BulkOperationSummary,
  EmployeeImportJobResponse,
  EmployeeImportRowResponse,
  EmployeeImportRowListParams,
  EmployeeImportJobStatusResponse,
  EmployeeImportRowDetailResponse,
  EmployeeGeographyImportUploadResponse,
  EmployeeGeographyImportJobResponse,
} from "./employee.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/employees`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

function normalizeEmployee(raw: EmployeeResponse): EmployeeResponse {
  const anyRaw = raw as unknown as Record<string, unknown>
  return {
    ...raw,
    employeeUuid: raw.employeeUuid ?? (anyRaw.publicId as string) ?? "",
    publicId: (anyRaw.publicId as string) ?? raw.employeeUuid ?? "",
    mobile: (raw.mobile ?? (anyRaw.phone as string) ?? null) as string | null,
  } as EmployeeResponse
}

export async function getEmployees(
  companyUuid: string,
  params?: EmployeeListParams
) {
  const resolved = companyHeader(companyUuid)
  // Backend expects `search` (not `query`) plus `status` / `designationUuid`.
  // `query` is also sent for endpoints that honor that name instead.
  const term = params?.search ?? params?.query
  const queryParams = params
    ? {
        search: term,
        query: term,
        status: params.status,
        designationUuid: params.designationUuid,
        page: params.page,
        size: params.size,
      }
    : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<EmployeeResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  const page = data.data
  return {
    ...page,
    content: page.content.map(normalizeEmployee),
  } as PageResponse<EmployeeResponse>
}

export async function getEmployee(companyUuid: string, employeeUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<EmployeeResponse>>(
    `${baseUrl(companyUuid)}/${employeeUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return normalizeEmployee(data.data)
}

export async function createEmployee(
  companyUuid: string,
  input: CreateEmployeeRequest
) {
  const resolved = companyHeader(companyUuid)
  const payload: Record<string, unknown> = { ...input }
  if (payload.phone && !payload.mobile) {
    payload.mobile = payload.phone
    delete payload.phone
  }
  const { data } = await apiClient.post<ApiSuccessResponse<EmployeeResponse>>(
    baseUrl(companyUuid),
    payload as CreateEmployeeRequest,
    { headers: { "X-Company-Context": resolved } }
  )
  return normalizeEmployee(data.data)
}

export async function updateEmployee(
  companyUuid: string,
  employeeUuid: string,
  input: UpdateEmployeeRequest
) {
  const resolved = companyHeader(companyUuid)
  const payload: Record<string, unknown> = { ...input }
  if (payload.phone && !payload.mobile) {
    payload.mobile = payload.phone
    delete payload.phone
  }
  const { data } = await apiClient.put<ApiSuccessResponse<EmployeeResponse>>(
    `${baseUrl(companyUuid)}/${employeeUuid}`,
    payload as UpdateEmployeeRequest,
    { headers: { "X-Company-Context": resolved } }
  )
  return normalizeEmployee(data.data)
}

export async function updateEmployeeStatus(
  companyUuid: string,
  employeeUuid: string,
  input: UpdateEmployeeStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<ApiSuccessResponse<EmployeeResponse>>(
    `${baseUrl(companyUuid)}/${employeeUuid}/status`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return normalizeEmployee(data.data)
}

export async function getEmployeeGeographies(
  companyUuid: string,
  employeeUuid: string,
  params?: EmployeeGeographyListParams
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<EmployeeGeographyResponse[]>
  >(`${baseUrl(companyUuid)}/${employeeUuid}/geographies`, {
    params,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function assignEmployeeGeography(
  companyUuid: string,
  employeeUuid: string,
  input: AssignEmployeeGeographyRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<EmployeeGeographyResponse[]>
  >(`${baseUrl(companyUuid)}/${employeeUuid}/geographies`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function removeEmployeeGeography(
  companyUuid: string,
  employeeUuid: string,
  geographyUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.delete<
    ApiSuccessResponse<EmployeeGeographyResponse[]>
  >(`${baseUrl(companyUuid)}/${employeeUuid}/geographies/${geographyUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Bulk Import ────────────────────────────────────────────────────────────

export async function getEmployeeImportTemplate(
  companyUuid: string,
  format?: "csv" | "xlsx"
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${baseUrl(companyUuid).replace("/employees", "/employee-imports")}/template`,
    {
      headers: { "X-Company-Context": resolved },
      params: format ? { format } : undefined,
      responseType: "blob",
    }
  )
  return data
}

export async function uploadEmployeeImport(companyUuid: string, file: File) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<EmployeeImportJobResponse>
  >(
    `${baseUrl(companyUuid).replace("/employees", "/employee-imports")}`,
    form,
    {
      headers: {
        "X-Company-Context": resolved,
      },
    }
  )
  return data.data
}

export async function getEmployeeImportJob(
  companyUuid: string,
  importJobUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<EmployeeImportJobResponse>
  >(
    `${baseUrl(companyUuid).replace("/employees", "/employee-imports")}/${importJobUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function getEmployeeImportJobStatus(companyUuid: string, jobUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<EmployeeImportJobStatusResponse>
  >(
    `${baseUrl(companyUuid).replace("/employees", "/employee-imports")}/${jobUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function getEmployeeImportRows(
  companyUuid: string,
  importJobUuid: string,
  params?: EmployeeImportRowListParams
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<EmployeeImportRowResponse>>
  >(
    `${baseUrl(companyUuid).replace("/employees", "/employee-imports")}/${importJobUuid}/rows`,
    { params, headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function getEmployeeImportFailedRows(
  companyUuid: string,
  jobUuid: string,
  params?: Pick<EmployeeImportRowListParams, "search">
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<EmployeeImportRowDetailResponse[]>
  >(
    `${baseUrl(companyUuid).replace("/employees", "/employee-imports")}/${jobUuid}/rows`,
    { params: { page: 0, size: 100, ...params }, headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function getEmployeeImportResultsCsv(
  companyUuid: string,
  importJobUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${baseUrl(companyUuid).replace("/employees", "/employee-imports")}/${importJobUuid}/results.csv`,
    { headers: { "X-Company-Context": resolved }, responseType: "blob" }
  )
  return data
}

// ── Employee Geography Import ─────────────────────────────────────────────

const employeeGeographyImportBaseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/employee-geography-imports`

export async function getEmployeeGeographyImportTemplate(
  companyUuid: string,
  format?: "csv" | "xlsx"
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${employeeGeographyImportBaseUrl(companyUuid)}/template`,
    {
      headers: { "X-Company-Context": resolved },
      params: format ? { format } : undefined,
      responseType: "blob",
    }
  )
  return data
}

export async function uploadEmployeeGeographyImport(companyUuid: string, file: File) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<EmployeeGeographyImportUploadResponse>
  >(employeeGeographyImportBaseUrl(companyUuid), form, {
    headers: {
      "X-Company-Context": resolved,
    },
  })
  return data.data
}

export async function getEmployeeGeographyImportJob(companyUuid: string, jobUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<EmployeeGeographyImportJobResponse>
  >(`${employeeGeographyImportBaseUrl(companyUuid)}/${jobUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getEmployeeGeographyImportResultsCsv(companyUuid: string, jobUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${employeeGeographyImportBaseUrl(companyUuid)}/${jobUuid}/results.csv`,
    { headers: { "X-Company-Context": resolved }, responseType: "blob" }
  )
  return data
}

// ── Master Data Export ───────────────────────────────────────────────────────
// Backend (Master Data Export folder):
//   GET /api/v1/companies/{companyUuid}/employees/export?format=csv|xlsx
//     (requires EMPLOYEE_EXPORT)
//   GET /api/v1/companies/{companyUuid}/employee-geography/export?format=csv|xlsx
//     (requires EMPLOYEE_GEOGRAPHY_EXPORT)
// Both return a file attachment (CSV text or XLSX binary).

const employeeGeographyBaseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/employee-geography`

export type ExportEmployeesFilters = {
  search?: string
  status?: string
  designationUuid?: string
}

export async function exportEmployees(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportEmployeesFilters
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(`${baseUrl(companyUuid)}/export`, {
    headers: { "X-Company-Context": resolved },
    // Mirror the list filters so applied search/status/designation narrow
    // the export. Unknown params are ignored by the backend.
    params: {
      format,
      search: filters?.search || undefined,
      query: filters?.search || undefined,
      status: filters?.status || undefined,
      designationUuid: filters?.designationUuid || undefined,
    },
    responseType: "blob",
    timeout: 60_000,
  })
  return data
}

export async function exportEmployeeGeography(
  companyUuid: string,
  format: "csv" | "xlsx"
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${employeeGeographyBaseUrl(companyUuid)}/export`,
    {
      headers: { "X-Company-Context": resolved },
      params: { format },
      responseType: "blob",
      timeout: 60_000,
    }
  )
  return data
}

// ── Employee Login Management ─────────────────────────────────────────────

export async function getEmployeeLoginStatus(
  companyUuid: string,
  employeeUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<EmployeeLoginStatusResponse>
  >(`${baseUrl(companyUuid)}/${employeeUuid}/login`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function enableEmployeeLogin(
  companyUuid: string,
  employeeUuid: string,
  input: EnableEmployeeLoginRequest
): Promise<EnableEmployeeLoginResponse> {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<RawEnableEmployeeLoginResponse>
  >(`${baseUrl(companyUuid)}/${employeeUuid}/login/enable`, input, {
    headers: { "X-Company-Context": resolved },
  })
  // Live backend nests credential fields under `login`:
  // `{ login: { userUuid, username, status, mustChangePassword },
  //    temporaryPassword, emailDispatched }`
  const raw = data.data
  const login = raw.login ?? {}
  return {
    userUuid: raw.userUuid ?? login.userUuid ?? "",
    username: raw.username ?? login.username ?? "",
    temporaryPassword: raw.temporaryPassword ?? null,
    emailDispatched: raw.emailDispatched,
    mustChangePassword:
      raw.mustChangePassword ?? login.mustChangePassword,
  }
}

export async function disableEmployeeLogin(
  companyUuid: string,
  employeeUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<DisableEmployeeLoginResponse>
  >(`${baseUrl(companyUuid)}/${employeeUuid}/login/disable`, undefined, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function resetEmployeePassword(
  companyUuid: string,
  employeeUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<EmployeeLoginStatusResponse>
  >(`${baseUrl(companyUuid)}/${employeeUuid}/login/reset-password`, undefined, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** Normalize the two bulk-operation envelopes the backend may return:
 * `{total, successful, skipped, failed, results[]}` or legacy
 * `{succeeded[], failed[]}`. */
function normalizeBulkResponse(raw: unknown): BulkOperationSummary {
  const d = (raw ?? {}) as Record<string, unknown>
  if (Array.isArray(d.results)) {
    // Per-entry credential fields may arrive nested under `login` — lift
    // them so dialogs can rely on the flat shape.
    const results = (d.results as BulkLoginResultEntry[]).map((r) => {
      if (!r?.login) return r
      const { login, ...rest } = r
      return {
        ...rest,
        userUuid: rest.userUuid ?? login?.userUuid,
        username: rest.username ?? login?.username,
      }
    })
    const successful =
      typeof d.successful === "number"
        ? d.successful
        : results.filter((r) => r?.status === "SUCCESS").length
    const failed =
      typeof d.failed === "number" ? d.failed : results.length - successful
    return {
      total: typeof d.total === "number" ? d.total : results.length,
      successful,
      skipped: typeof d.skipped === "number" ? d.skipped : 0,
      failed,
      results,
    }
  }
  const succeeded = ((d.succeeded ?? []) as BulkLoginResultEntry[]).map(
    (r) => ({ ...r, status: r.status ?? "SUCCESS" })
  )
  const failed = ((d.failed ?? []) as BulkLoginResultEntry[]).map((r) => ({
    ...r,
    status: r.status ?? "FAILED",
  }))
  return {
    total: succeeded.length + failed.length,
    successful: succeeded.length,
    skipped: 0,
    failed: failed.length,
    results: [...succeeded, ...failed],
  }
}

export async function bulkEnableEmployeeLogin(
  companyUuid: string,
  input: BulkEnableEmployeeLoginRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<unknown>
  >(`${baseUrl(companyUuid)}/login/bulk-enable`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return normalizeBulkResponse(data.data)
}

export async function bulkDisableEmployeeLogin(
  companyUuid: string,
  input: BulkDisableEmployeeLoginRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<unknown>
  >(`${baseUrl(companyUuid)}/login/bulk-disable`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return normalizeBulkResponse(data.data)
}
