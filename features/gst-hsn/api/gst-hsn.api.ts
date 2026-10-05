import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  GstHsnResponse,
  CreateGstHsnRequest,
  UpdateGstHsnRequest,
  UpdateGstHsnStatusRequest,
  GstHsnListParams,
  GstHsnImportResponse,
} from "./gst-hsn.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/gst-hsn`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getGstHsns(
  companyUuid: string,
  params?: GstHsnListParams
) {
  const resolved = companyHeader(companyUuid)
  // Send both `query` and `search`: different backend endpoints honor
  // different names, unknown params are ignored.
  const term = params?.query ?? params?.search
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<GstHsnResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getGstHsn(companyUuid: string, hsnUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<GstHsnResponse>>(
    `${baseUrl(companyUuid)}/${hsnUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function createGstHsn(
  companyUuid: string,
  input: CreateGstHsnRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<ApiSuccessResponse<GstHsnResponse>>(
    baseUrl(companyUuid),
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function updateGstHsn(
  companyUuid: string,
  hsnUuid: string,
  input: UpdateGstHsnRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<ApiSuccessResponse<GstHsnResponse>>(
    `${baseUrl(companyUuid)}/${hsnUuid}`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function updateGstHsnStatus(
  companyUuid: string,
  hsnUuid: string,
  input: UpdateGstHsnStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<ApiSuccessResponse<GstHsnResponse>>(
    `${baseUrl(companyUuid)}/${hsnUuid}/status`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

// ── Bulk Import ────────────────────────────────────────────────────────────
// Collection folder "21 - Supporting Master Imports" (singular `/import`):
//   GET  .../gst-hsn/import/template?format=csv|xlsx
//   POST .../gst-hsn/import (multipart `file`; synchronous result, no job id)

export async function getGstHsnImportTemplate(
  companyUuid: string,
  format?: "csv" | "xlsx"
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${baseUrl(companyUuid)}/import/template`,
    {
      headers: { "X-Company-Context": resolved },
      params: format ? { format } : undefined,
      responseType: "blob",
    }
  )
  return data
}

export async function uploadGstHsnImport(companyUuid: string, file: File) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<GstHsnImportResponse>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Master Data Export ───────────────────────────────────────────────────────
// No export endpoint exists for GST HSN in the Postman collection. This
// follows the same convention as the other masters
// (GET {base}/export?format=csv|xlsx) in case the backend supports it.
export type ExportGstHsnsFilters = {
  search?: string
  status?: string
}

export async function exportGstHsns(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportGstHsnsFilters
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(`${baseUrl(companyUuid)}/export`, {
    headers: { "X-Company-Context": resolved },
    params: {
      format,
      query: filters?.search || undefined,
      search: filters?.search || undefined,
      status: filters?.status || undefined,
    },
    responseType: "blob",
    timeout: 60_000,
  })
  return data
}
