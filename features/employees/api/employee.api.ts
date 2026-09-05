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
  AssignEmployeeGeographyRequest,
  EmployeeLoginStatusResponse,
  EnableEmployeeLoginRequest,
  EmployeeImportJobResponse,
  EmployeeImportRowResponse,
} from "./employee.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/v1/companies/${resolveCompanyUuid(companyUuid)}/employees`

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
  const queryParams = params
    ? ({
        ...params,
        query:
          (params as Record<string, unknown>).query ??
          (params as Record<string, unknown>).search,
      } as EmployeeListParams)
    : params
  if (queryParams && "search" in (queryParams as Record<string, unknown>))
    delete (queryParams as Record<string, unknown>).search
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
  employeeUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<EmployeeGeographyResponse[]>
  >(`${baseUrl(companyUuid)}/${employeeUuid}/geographies`, {
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

export async function getEmployeeImportRows(
  companyUuid: string,
  importJobUuid: string,
  params?: { page?: number; size?: number }
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
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<EmployeeLoginStatusResponse>
  >(`${baseUrl(companyUuid)}/${employeeUuid}/login/enable`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function disableEmployeeLogin(
  companyUuid: string,
  employeeUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<EmployeeLoginStatusResponse>
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
