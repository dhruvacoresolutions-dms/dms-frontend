import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type { PageResponse } from "@/features/companies/api/company.types"
import type {
  GstTaxCodeResponse,
  CreateGstTaxCodeRequest,
  CreateGstTaxCodeVersionRequest,
  PatchGstTaxCodeVersionRequest,
  GstTaxCodeListParams,
  GstTaxCodeImportResultResponse,
} from "./gst-tax-code.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/gst-tax-codes`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

// ── Tax codes ────────────────────────────────────────────────────────────────

export async function getGstTaxCodes(
  companyUuid: string,
  params?: GstTaxCodeListParams
) {
  const resolved = companyHeader(companyUuid)
  // Send both `query` and `search`: the backend documents `search` but the
  // list page passes `query`; unknown params are ignored.
  const rawParams = params as Record<string, unknown> | undefined
  const term = (rawParams?.query ?? rawParams?.search) as string | undefined
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<GstTaxCodeResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** All versions of a tax code, newest first. */
export async function getGstTaxCodeVersions(
  companyUuid: string,
  taxCode: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<GstTaxCodeResponse[]>
  >(`${baseUrl(companyUuid)}/${encodeURIComponent(taxCode)}/versions`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createGstTaxCode(
  companyUuid: string,
  input: CreateGstTaxCodeRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<GstTaxCodeResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** Publish a new effective-dated version of an existing tax code. */
export async function createGstTaxCodeVersion(
  companyUuid: string,
  taxCode: string,
  input: CreateGstTaxCodeVersionRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<GstTaxCodeResponse>
  >(`${baseUrl(companyUuid)}/${encodeURIComponent(taxCode)}/versions`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** Partial update of one version (status / description / effectiveTo). */
export async function patchGstTaxCodeVersion(
  companyUuid: string,
  versionUuid: string,
  input: PatchGstTaxCodeVersionRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<GstTaxCodeResponse>
  >(`${baseUrl(companyUuid)}/versions/${versionUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

/** Resolve the effective version of a tax code as of a date. */
export async function resolveGstTaxCode(
  companyUuid: string,
  taxCode: string,
  asOf: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<GstTaxCodeResponse>>(
    `${baseUrl(companyUuid)}/resolve`,
    {
      params: { taxCode, asOf },
      headers: { "X-Company-Context": resolved },
    }
  )
  return data.data
}

// ── Master Data Export ───────────────────────────────────────────────────────
// GET /api/v1/companies/{companyUuid}/gst-tax-codes/export?format=csv|xlsx

export type ExportGstTaxCodesFilters = {
  search?: string
  status?: string
}

export async function exportGstTaxCodes(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportGstTaxCodesFilters
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

// ── Bulk Import (folder 21) ──────────────────────────────────────────────────
//   GET  .../gst-tax-codes/import/template?format=csv|xlsx
//   POST .../gst-tax-codes/import (multipart `file`; synchronous result)

export async function getGstTaxCodeImportTemplate(
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

export async function uploadGstTaxCodeImport(companyUuid: string, file: File) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<GstTaxCodeImportResultResponse>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}
