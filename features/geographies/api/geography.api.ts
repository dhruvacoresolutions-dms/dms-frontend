import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  GeographyResponse,
  CreateGeographyRequest,
  UpdateGeographyRequest,
  UpdateGeographyStatusRequest,
  GeographyListParams,
  GeographyImportJobResponse,
} from "./geography.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/geographies`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getGeographies(
  companyUuid: string,
  params?: GeographyListParams
) {
  const resolved = companyHeader(companyUuid)
  // Send both `query` and `search`: different backend endpoints honor
  // different names, unknown params are ignored.
  const rawParams = params as Record<string, unknown> | undefined
  const term = (rawParams?.query ?? rawParams?.search) as string | undefined
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<GeographyResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getGeography(
  companyUuid: string,
  geographyUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<GeographyResponse>
  >(`${baseUrl(companyUuid)}/${geographyUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createGeography(
  companyUuid: string,
  input: CreateGeographyRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<GeographyResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateGeography(
  companyUuid: string,
  geographyUuid: string,
  input: UpdateGeographyRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<GeographyResponse>
  >(`${baseUrl(companyUuid)}/${geographyUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateGeographyStatus(
  companyUuid: string,
  geographyUuid: string,
  input: UpdateGeographyStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<GeographyResponse>
  >(`${baseUrl(companyUuid)}/${geographyUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Bulk Import ────────────────────────────────────────────────────────────

export async function getGeographyImportTemplate(
  companyUuid: string,
  format?: "csv" | "xlsx"
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${baseUrl(companyUuid)}/imports/template`,
    {
      headers: { "X-Company-Context": resolved },
      params: format ? { format } : undefined,
      responseType: "blob",
    }
  )
  return data
}

export async function uploadGeographyImport(companyUuid: string, file: File) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ importJobUuid?: string; publicId?: string } & Record<string, unknown>>
  >(`${baseUrl(companyUuid)}/imports`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getGeographyImportJob(companyUuid: string, jobUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<GeographyImportJobResponse>
  >(`${baseUrl(companyUuid)}/imports/${jobUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getGeographyImportResultsCsv(companyUuid: string, jobUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${baseUrl(companyUuid)}/imports/${jobUuid}/results.csv`,
    { headers: { "X-Company-Context": resolved }, responseType: "blob" }
  )
  return data
}

// ── Master Data Export ───────────────────────────────────────────────────────
// Backend: GET /api/v1/companies/{companyUuid}/geographies/export?format=csv|xlsx
// (Master Data Export folder). Requires GEOGRAPHY_EXPORT. Returns a file
// attachment (CSV text or XLSX binary).

export async function exportGeographies(
  companyUuid: string,
  format: "csv" | "xlsx"
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(`${baseUrl(companyUuid)}/export`, {
    headers: { "X-Company-Context": resolved },
    params: { format },
    responseType: "blob",
    timeout: 60_000,
  })
  return data
}
